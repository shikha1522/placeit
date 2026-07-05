import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Contest.css";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function TakeContest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: "a"|"b"|"c"|"d" }
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${id}/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      navigate(`/contests/${id}/results`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      submittedRef.current = false;
    }
  }, [id, answers, navigate]);

  useEffect(() => {
    fetch(`/api/contests/${id}/questions`, { headers: authHeaders() })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load contest");
        return data;
      })
      .then((data) => {
        setContest(data.contest);
        setQuestions(data.questions);
        const endTime = new Date(data.contest.start_time).getTime() + data.contest.duration_minutes * 60000;
        setSecondsLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === null]);

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  if (loading) return <div className="contest-page">Loading contest...</div>;
  if (error && !contest) return <div className="contest-page contest-error">{error}</div>;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="contest-page">
      <div className="take-contest-header">
        <h1>{contest.title}</h1>
        <div className={`timer ${secondsLeft < 60 ? "timer-warning" : ""}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      {error && <div className="contest-error">{error}</div>}

      <ol className="contest-question-list">
        {questions.map((q, idx) => (
          <li key={q.id}>
            <p className="q-text">
              {idx + 1}. {q.question_text}
            </p>
            <ul className="q-options selectable">
              {["a", "b", "c", "d"].map((opt) => (
                <li
                  key={opt}
                  className={answers[q.id] === opt ? "selected" : ""}
                  onClick={() => selectAnswer(q.id, opt)}
                >
                  {opt.toUpperCase()}. {q[`option_${opt}`]}
                </li>
              ))}
            </ul>
            <span className="q-marks">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
          </li>
        ))}
      </ol>

      <button className="publish-btn" onClick={submit} disabled={submitting}>
        {submitting ? "Submitting..." : `Submit (${Object.keys(answers).length}/${questions.length} answered)`}
      </button>
    </div>
  );
}