import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Contest.css";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const STATUS_LABEL = {
  upcoming: "Upcoming",
  ongoing: "Live Now",
  completed: "Completed",
};

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/contests`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setContests(data);
        else setError(data.error || "Failed to load contests");
      })
      .catch(() => setError("Failed to load contests"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="contest-page">Loading contests...</div>;

  return (
    <div className="contest-page">
      <h1>Contests</h1>
      {error && <div className="contest-error">{error}</div>}

      {contests.length === 0 && !error && (
        <p className="contest-subtext">No contests available right now. Check back soon.</p>
      )}

      <div className="contest-card-list">
        {contests.map((c) => (
          <div key={c.id} className={`contest-card status-${c.time_status}`}>
            <div className="contest-card-header">
              <h3>{c.title}</h3>
              <span className={`badge badge-${c.time_status}`}>{STATUS_LABEL[c.time_status]}</span>
            </div>
            {c.description && <p>{c.description}</p>}
            <p className="contest-meta">
              Duration: {c.duration_minutes} min · Starts: {new Date(c.start_time).toLocaleString()}
            </p>

            {c.time_status === "ongoing" && (
              <Link className="contest-action" to={`/contests/${c.id}/take`}>
                Enter Contest
              </Link>
            )}
            {c.time_status === "completed" && (
              <Link className="contest-action secondary" to={`/contests/${c.id}/results`}>
                View Results
              </Link>
            )}
            {c.time_status === "upcoming" && (
              <span className="contest-action disabled">Starts soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}