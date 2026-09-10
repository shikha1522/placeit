import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Contest.css";
import env from 'dotenv';
env.config();

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function ContestResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/contests/${id}/my-result`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`/api/contests/${id}/leaderboard`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([myResult, board]) => {
        if (myResult.error) setError(myResult.error);
        else setResult(myResult);
        if (Array.isArray(board)) setLeaderboard(board);
      })
      .catch(() => setError("Failed to load results"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="contest-page">Loading results...</div>;

  return (
    <div className="contest-page">
      <h1>Contest Results</h1>

      {error && <div className="contest-error">{error}</div>}

      {result && (
        <>
          <div className="score-summary">
            Your Score: <strong>{result.submission.score}</strong> / {result.totalMarks}
          </div>

          {result.feedback && (
            <div className="ai-feedback">
              <h3>Feedback</h3>
              <p>{result.feedback}</p>
            </div>
          )}

          <ol className="contest-question-list">
            {result.questions.map((q, idx) => {
              const given = result.responses?.[q.id];
              return (
                <li key={q.id}>
                  <p className="q-text">
                    {idx + 1}. {q.question_text}
                  </p>
                  <ul className="q-options">
                    {["a", "b", "c", "d"].map((opt) => (
                      <li
                        key={opt}
                        className={
                          q.correct_option === opt
                            ? "correct"
                            : given === opt
                            ? "incorrect-selected"
                            : ""
                        }
                      >
                        {opt.toUpperCase()}. {q[`option_${opt}`]}
                      </li>
                    ))}
                  </ul>
                  <span className="q-marks">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <h2>Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, idx) => (
            <tr key={row.id}>
              <td>{idx + 1}</td>
              <td>{row.name}</td>
              <td>{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}