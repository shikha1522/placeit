// Import database connection
import pool from '../config/db.js';

// Get all questions with optional search and filters
export const getQuestions = async (req, res) => {
  try {
    // Extract query params (all optional)
    const { search, difficulty, topic, company_id, page = 1 } = req.query;

    // How many questions per page
    const limit = 20;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Start building query conditions and values array
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Add search condition if search param exists
    // Add search condition if search param exists
if (search) {
  conditions.push(`(title ILIKE $${paramIndex} OR topic ILIKE $${paramIndex})`);
  values.push(`%${search.trim()}%`);
  paramIndex++;
}

    // Add difficulty filter if provided
    if (difficulty) {
      conditions.push(`difficulty = $${paramIndex}`);
      values.push(difficulty);
      paramIndex++;
    }

    // Add topic filter if provided
    if (topic) {
      conditions.push(`topic = $${paramIndex}`);
      values.push(topic);
      paramIndex++;
    }

    // Add company filter if provided
    if (company_id) {
      conditions.push(`company_id = $${paramIndex}`);
      values.push(company_id);
      paramIndex++;
    }

    // Build WHERE clause only if conditions exist
    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM questions ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination values
    values.push(limit);
    values.push(offset);

    values.push(req.user.id);

    // Final query to get questions
   const result = await pool.query(
  `SELECT 
    q.id,
    q.title,
    q.difficulty,
    q.topic,
    q.leetcode_url,
    q.company_id,
    q.created_at,
    c.name as company_name,
    COALESCE(uq.solved, false) as solved
   FROM questions q
   LEFT JOIN companies c ON q.company_id = c.id
   LEFT JOIN user_questions uq ON q.id = uq.question_id AND uq.user_id = $${paramIndex + 2}
   ${whereClause}
   ORDER BY q.created_at DESC
   LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
  values
);

    // Send response with questions and pagination info
    res.json({
      success: true,
      questions: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single question by id
export const getQuestionById = async (req, res) => {
  try {
    // Get question id from URL params
    const { id } = req.params;

    // Query single question with company name
    const result = await pool.query(
      `SELECT 
        q.*,
        c.name as company_name
       FROM questions q
       LEFT JOIN companies c ON q.company_id = c.id
       WHERE q.id = $1`,
      [id]
    );

    // If question not found return 404
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    console.error('Get question error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle solved status and save notes for a question
export const solveQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { notes } = req.body;

    const existing = await pool.query(
      `SELECT * FROM user_questions WHERE user_id = $1 AND question_id = $2`,
      [user_id, id]
    );

    let newSolvedStatus;

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_questions (user_id, question_id, solved, notes, solved_at)
         VALUES ($1, $2, true, $3, NOW())`,
        [user_id, id, notes || null]
      );
      newSolvedStatus = true;
    } else {
      const currentSolved = existing.rows[0].solved;
      newSolvedStatus = !currentSolved;
      await pool.query(
        `UPDATE user_questions
         SET solved = $1, notes = $2, solved_at = $3
         WHERE user_id = $4 AND question_id = $5`,
        [newSolvedStatus, notes || existing.rows[0].notes, newSolvedStatus ? new Date() : null, user_id, id]
      );
    }

    

    res.json({ success: true, message: 'Question status updated' });
  } catch (err) {
    console.error('Solve question error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get per user question solving stats
export const getQuestionStats = async (req, res) => {
  try {
    // Get user id from auth middleware
    const user_id = req.user.id;

    // Get solved count grouped by difficulty
    const result = await pool.query(
      `SELECT 
        q.difficulty,
        COUNT(*) FILTER (WHERE uq.solved = true) as solved,
        COUNT(*) as total
       FROM questions q
       LEFT JOIN user_questions uq ON q.id = uq.question_id AND uq.user_id = $1
       GROUP BY q.difficulty`,
      [user_id]
    );

    // Get solved count grouped by topic
    const topicResult = await pool.query(
      `SELECT 
        q.topic,
        COUNT(*) FILTER (WHERE uq.solved = true) as solved,
        COUNT(*) as total
       FROM questions q
       LEFT JOIN user_questions uq ON q.id = uq.question_id AND uq.user_id = $1
       GROUP BY q.topic
       ORDER BY total DESC`,
      [user_id]
    );

    res.json({
      success: true,
      byDifficulty: result.rows,
      byTopic: topicResult.rows
    });
  } catch (err) {
    console.error('Question stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};