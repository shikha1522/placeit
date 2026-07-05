import { GoogleGenerativeAI } from "@google/generative-ai";

// Requires GEMINI_API_KEY in server/.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate MCQs for a given topic/difficulty using Gemini.
 * Returns a normalized, validated array ready to insert into contest_questions.
 */
export async function generateMCQs({ topic, difficulty = "Medium", numQuestions = 10 }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert quiz setter for a computer science placement-prep platform.
Generate exactly ${numQuestions} multiple-choice questions on the topic "${topic}" at "${difficulty}" difficulty.

Rules:
- Each question must have exactly 4 options: option_a, option_b, option_c, option_d.
- Exactly one option is correct.
- correct_option must be the lowercase letter "a", "b", "c", or "d".
- marks: use 1 for Easy, 2 for Medium, 3 for Hard.
- Questions must be technically accurate and unambiguous.
- Do NOT include any explanation, markdown formatting, or text outside the JSON.
- Return ONLY a valid JSON array, nothing else.

Format:
[
  {
    "question_text": "string",
    "option_a": "string",
    "option_b": "string",
    "option_c": "string",
    "option_d": "string",
    "correct_option": "a",
    "marks": 2
  }
]`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  // Gemini sometimes wraps JSON in ```json fences despite instructions
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Gemini returned invalid JSON: " + err.message);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Gemini did not return a valid question array");
  }

  const fallbackMarks = difficulty === "Hard" ? 3 : difficulty === "Easy" ? 1 : 2;

  return questions.map((q, i) => {
    if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      throw new Error(`Question ${i + 1} from Gemini is missing required fields`);
    }
    const correct = String(q.correct_option || "").trim().toLowerCase();
    if (!["a", "b", "c", "d"].includes(correct)) {
      throw new Error(`Question ${i + 1} from Gemini has invalid correct_option: ${q.correct_option}`);
    }
    return {
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: correct,
      marks: Number(q.marks) > 0 ? Number(q.marks) : fallbackMarks,
    };
  });
}

/**
 * Ask Gemini to review a completed submission and write short, personalized
 * feedback — not just "you scored X/Y", but which topics/questions to revisit.
 */
export async function generateResultFeedback({ contestTitle, score, totalMarks, breakdown }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // breakdown: [{ question_text, given_text, correct_text, correct: bool, marks }]
  const missed = breakdown.filter((b) => !b.correct);
  const missedSummary = missed
    .map(
      (m, i) =>
        `${i + 1}. Q: ${m.question_text}\n   Student answered: ${m.given_text || "(no answer)"}\n   Correct answer: ${m.correct_text}`
    )
    .join("\n");

  const prompt = `You are a supportive placement-prep coach reviewing a student's quiz attempt.

Contest: "${contestTitle}"
Score: ${score} / ${totalMarks}
Total questions: ${breakdown.length}, missed: ${missed.length}

${missed.length > 0 ? `Questions the student got wrong:\n${missedSummary}` : "The student answered every question correctly."}

Write a short (4-6 sentence) feedback message directly to the student:
- Be encouraging but honest.
- If they missed questions, point out 1-2 concrete concepts/topics to revisit (based on the missed questions above), without just repeating the correct answers verbatim.
- If they got everything right, congratulate them and suggest a slightly harder related topic to try next.
- Plain text only, no markdown, no headers.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    // Feedback is a nice-to-have; never let it break the submission flow.
    console.error("generateResultFeedback error:", err);
    return null;
  }
}