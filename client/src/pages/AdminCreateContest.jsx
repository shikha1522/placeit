import { useState } from "react";
import "../styles/Contest.css";
import env from 'dotenv';
env.config();

// ASSUMPTION: JWT stored in localStorage under "token", same as your other
// Phase 3/5/7 pages. Adjust the header helper if your app stores it elsewhere.
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function AdminCreateContest() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "",
    difficulty: "Medium",
    numQuestions: 10,
    duration_minutes: 30,
    start_time: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { contest, questions } after generation — already published

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contests/generate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          numQuestions: Number(form.numQuestions),
          duration_minutes: Number(form.duration_minutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate contest");
      setResult(data); // contest is already published — no separate approval step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contest-page">
      <h1>Create AI Contest</h1>
      <p className="contest-subtext">
        Fill in the details below — Gemini will generate the MCQs, then you can
        review them before publishing to students.
      </p>

      <form className="contest-form" onSubmit={handleGenerate}>
        <label>
          Title
          <input value={form.title} onChange={update("title")} required />
        </label>

        <label>
          Description
          <textarea value={form.description} onChange={update("description")} rows={2} />
        </label>

        <label>
          Topic (for the AI, e.g. "Binary Search Trees", "SQL Joins")
          <input value={form.topic} onChange={update("topic")} required />
        </label>

        <div className="contest-form-row">
          <label>
            Difficulty
            <select value={form.difficulty} onChange={update("difficulty")}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <label>
            Number of Questions
            <input
              type="number"
              min={1}
              max={50}
              value={form.numQuestions}
              onChange={update("numQuestions")}
            />
          </label>

          <label>
            Duration (minutes)
            <input
              type="number"
              min={1}
              value={form.duration_minutes}
              onChange={update("duration_minutes")}
            />
          </label>
        </div>

        <label>
          Start Time
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={update("start_time")}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Generating with Gemini..." : "Generate Contest"}
        </button>
      </form>

      {error && <div className="contest-error">{error}</div>}

      {result && (
        <div className="contest-review">
          <div className="contest-success">
            "{result.contest.title}" is live — {result.questions.length} questions generated and
            published automatically. Students can enter once it starts.
          </div>

          <h2>Generated Questions</h2>
          <ol className="contest-question-list">
            {result.questions.map((q) => (
              <li key={q.id}>
                <p className="q-text">{q.question_text}</p>
                <ul className="q-options">
                  <li className={q.correct_option === "a" ? "correct" : ""}>A. {q.option_a}</li>
                  <li className={q.correct_option === "b" ? "correct" : ""}>B. {q.option_b}</li>
                  <li className={q.correct_option === "c" ? "correct" : ""}>C. {q.option_c}</li>
                  <li className={q.correct_option === "d" ? "correct" : ""}>D. {q.option_d}</li>
                </ul>
                <span className="q-marks">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}