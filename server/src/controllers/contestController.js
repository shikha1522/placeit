// ASSUMPTION: adjust this import to match your actual pg pool file location
// (e.g. it might be server/src/db.js or server/src/config/database.js in your repo)
import pool from "../config/db.js";
import { generateMCQs, generateResultFeedback } from "../services/geminiService.js";

// Derive a live status from start_time + duration, independent of the
// stored `status` column (which we use for draft/published visibility).
function computeTimeStatus(start_time, duration_minutes) {
  const now = new Date();
  const start = new Date(start_time);
  const end = new Date(start.getTime() + duration_minutes * 60000);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

// POST /api/contests/generate  (admin) — Gemini generates the MCQs and the
// contest goes straight to "published". No manual admin review/approval step.
export const createContestWithAI = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title,
      description,
      topic,
      difficulty = "Medium",
      numQuestions = 10,
      duration_minutes,
      start_time,
    } = req.body;

    if (!title || !topic || !duration_minutes || !start_time) {
      return res.status(400).json({ error: "title, topic, duration_minutes, and start_time are required" });
    }

    const questions = await generateMCQs({ topic, difficulty, numQuestions: Number(numQuestions) });

    await client.query("BEGIN");

    const contestResult = await client.query(
      `INSERT INTO contests (title, description, duration_minutes, start_time, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, 'published', $5, NOW())
       RETURNING *`,
      [title, description || null, duration_minutes, start_time, req.user.id]
    );
    const contest = contestResult.rows[0];

    const insertedQuestions = [];
    for (const q of questions) {
      const qResult = await client.query(
        `INSERT INTO contest_questions
           (contest_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [contest.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.marks]
      );
      insertedQuestions.push(qResult.rows[0]);
    }

    await client.query("COMMIT");

    // Admin gets full questions (with correct_option) back so they can review before publishing
    res.status(201).json({ contest, questions: insertedQuestions });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createContestWithAI error:", err);
    res.status(500).json({ error: err.message || "Failed to create contest" });
  } finally {
    client.release();
  }
};

// GET /api/contests  — students see published only, admins see everything
export const getAllContests = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const query = isAdmin
      ? `SELECT * FROM contests ORDER BY start_time DESC`
      : `SELECT * FROM contests WHERE status = 'published' ORDER BY start_time DESC`;
    const result = await pool.query(query);

    const contests = result.rows.map((c) => ({
      ...c,
      time_status: computeTimeStatus(c.start_time, c.duration_minutes),
    }));

    res.json(contests);
  } catch (err) {
    console.error("getAllContests error:", err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
};

// GET /api/contests/:id
export const getContestById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM contests WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Contest not found" });

    const contest = result.rows[0];
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(marks), 0)::int AS total_marks
       FROM contest_questions WHERE contest_id = $1`,
      [id]
    );

    res.json({
      ...contest,
      time_status: computeTimeStatus(contest.start_time, contest.duration_minutes),
      question_count: countResult.rows[0].count,
      total_marks: countResult.rows[0].total_marks,
    });
  } catch (err) {
    console.error("getContestById error:", err);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
};

// GET /api/contests/:id/questions  — student begins the contest
export const getContestQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contestResult = await pool.query(`SELECT * FROM contests WHERE id = $1`, [id]);
    if (contestResult.rows.length === 0) return res.status(404).json({ error: "Contest not found" });
    const contest = contestResult.rows[0];

    const timeStatus = computeTimeStatus(contest.start_time, contest.duration_minutes);
    if (timeStatus === "upcoming") return res.status(403).json({ error: "Contest has not started yet" });
    if (timeStatus === "completed") return res.status(403).json({ error: "Contest has already ended" });

    const existing = await pool.query(
      `SELECT id FROM contest_submissions WHERE contest_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "You have already submitted this contest" });
    }

    // correct_option is deliberately excluded from what students receive
    const questionsResult = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, marks
       FROM contest_questions WHERE contest_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      contest: { ...contest, time_status: timeStatus },
      questions: questionsResult.rows,
    });
  } catch (err) {
    console.error("getContestQuestions error:", err);
    res.status(500).json({ error: "Failed to fetch contest questions" });
  }
};

// POST /api/contests/:id/submit  — body: { answers: { [questionId]: "a"|"b"|"c"|"d" } }
// Grading itself is deterministic (exact match against correct_option — MCQs
// don't need an LLM to know a==a), but Gemini reviews the attempt afterward
// and writes personalized feedback on what to revisit, so the result the
// student sees is AI-generated end to end, not just a raw score.
export const submitContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "answers object is required" });
    }

    const existing = await pool.query(
      `SELECT id FROM contest_submissions WHERE contest_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "You have already submitted this contest" });
    }

    const contestResult = await pool.query(`SELECT title FROM contests WHERE id = $1`, [id]);
    if (contestResult.rows.length === 0) return res.status(404).json({ error: "Contest not found" });
    const contestTitle = contestResult.rows[0].title;

    const questionsResult = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, marks
       FROM contest_questions WHERE contest_id = $1`,
      [id]
    );

    let score = 0;
    let totalMarks = 0;
    const breakdown = [];
    for (const q of questionsResult.rows) {
      const given = answers[q.id];
      const givenLetter = given ? String(given).toLowerCase() : null;
      const isCorrect = givenLetter === q.correct_option;
      totalMarks += q.marks;
      if (isCorrect) score += q.marks;
      breakdown.push({
        question_id: q.id,
        question_text: q.question_text,
        correct: isCorrect,
        correct_option: q.correct_option,
        correct_text: q[`option_${q.correct_option}`],
        given_option: givenLetter,
        given_text: givenLetter ? q[`option_${givenLetter}`] : null,
        marks: q.marks,
      });
    }

    // AI-written feedback on the attempt. Never blocks submission if it fails.
    const feedback = await generateResultFeedback({
      contestTitle,
      score,
      totalMarks,
      breakdown,
    });

    const storedPayload = JSON.stringify({ responses: answers, feedback });

    const submissionResult = await pool.query(
      `INSERT INTO contest_submissions (contest_id, user_id, answers, score, submitted_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, userId, storedPayload, score]
    );

    res.status(201).json({
      submission: submissionResult.rows[0],
      score,
      totalMarks,
      feedback,
      breakdown,
    });
  } catch (err) {
    console.error("submitContest error:", err);
    res.status(500).json({ error: "Failed to submit contest" });
  }
};

// GET /api/contests/:id/leaderboard
export const getContestLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT cs.id, cs.user_id, u.name, cs.score, cs.submitted_at
       FROM contest_submissions cs
       JOIN users u ON u.id = cs.user_id
       WHERE cs.contest_id = $1
       ORDER BY cs.score DESC, cs.submitted_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getContestLeaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

// GET /api/contests/:id/my-result
export const getMyResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await pool.query(
      `SELECT * FROM contest_submissions WHERE contest_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (submission.rows.length === 0) return res.status(404).json({ error: "No submission found" });

    const questions = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, marks
       FROM contest_questions WHERE contest_id = $1 ORDER BY id ASC`,
      [id]
    );

    const totalMarks = questions.rows.reduce((sum, q) => sum + q.marks, 0);
    let payload = { responses: {}, feedback: null };
const raw = submission.rows[0].answers;

if (raw) {
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { responses: JSON.parse(raw), feedback: null };
    }
  } else {
    // pg already parsed JSONB into an object — use it directly
    payload = raw.responses !== undefined ? raw : { responses: raw, feedback: null };
  }
}

    res.json({
      submission: submission.rows[0],
      responses: payload.responses || {},
      feedback: payload.feedback || null,
      totalMarks,
      questions: questions.rows,
    });
  } catch (err) {
    console.error("getMyResult error:", err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
};