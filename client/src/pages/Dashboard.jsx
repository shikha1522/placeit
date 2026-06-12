// Dashboard.jsx
// The main dashboard page — shown at /dashboard
// Fetches real data from /api/dashboard/stats on mount
// Renders: notification pills, stats cards, DSA donut, upcoming companies, recent activity

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DonutChart from "../components/DonutChart";
import "../styles/Dashboard.css";

// ── Helper: convert timestamp to "2h ago", "yesterday", "3 days ago" ──
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);       // ms → minutes
  const hours   = Math.floor(diffMs / 3600000);      // ms → hours
  const days    = Math.floor(diffMs / 86400000);     // ms → days

  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days === 1)   return "yesterday";
  return `${days} days ago`;
};

// ── Helper: format days_left into label like "3 days", "1 week", "2 weeks" ──
const formatDaysLeft = (days) => {
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 7)  return `${days} days`;
  if (days < 14) return "1 week";
  return `${Math.round(days / 7)} weeks`;
};

// ── Helper: get CSS class for role tag color ──
// SDE → blue, Intern → yellow, Analyst → purple, etc.
const getRoleTagClass = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("intern"))  return "tag--yellow";
  if (r.includes("analyst")) return "tag--purple";
  return "tag--blue"; // default SDE, SWE, etc.
};

// ── Helper: icon for each activity type ──
const ActivityIcon = ({ type }) => {
  // Each type maps to a different colored icon
  if (type === "dsa") return (
    // Green checkmark for DSA solved
    <span className="activity-icon activity-icon--green">✓</span>
  );
  if (type === "application") return (
    // Blue arrow for application
    <span className="activity-icon activity-icon--blue">➤</span>
  );
  if (type === "contest") return (
    // Purple star for contest
    <span className="activity-icon activity-icon--purple">★</span>
  );
  return <span className="activity-icon">•</span>;
};

// ── Notification pill color by type ──
const getPillClass = (type) => {
  if (type === "success") return "pill--green";
  if (type === "warning") return "pill--yellow";
  return "pill--blue"; // default info
};

// ────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ────────────────────────────────────────────
const Dashboard = () => {
  // Auth context gives us the JWT token for API calls
  const { token } = useAuth();

  // Component state
  const [data, setData]       = useState(null);   // dashboard data from API
  const [loading, setLoading] = useState(true);   // show skeleton while loading
  const [error, setError]     = useState(null);   // show error if API fails

  // ── Fetch dashboard data on component mount ──
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard/stats", {
          headers: {
            // Send JWT token in Authorization header
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard data");

        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || "Unknown error");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a token
    if (token) fetchDashboard();
  }, [token]); // re-fetch if token changes

  // ── Loading state: skeleton cards ──
  if (loading) {
    return (
      <div className="dashboard-loading">
        {/* Skeleton grid — pulse animation via CSS */}
        <div className="skeleton-pill" />
        <div className="skeleton-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
        <div className="skeleton-row">
          <div className="skeleton-donut" />
          <div className="skeleton-list" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="dashboard-error">
        <p>⚠️ Could not load dashboard: {error}</p>
        <p>Make sure the backend server is running on port 5000.</p>
      </div>
    );
  }

  // ── Destructure data for cleaner JSX ──
  const {
    stats,
    dsaProgress,
    upcomingCompanies,
    recentActivity,
    notifications,
  } = data;

  return (
    <div className="dashboard">

      {/* ══════════════════════════════════════
          NOTIFICATION PILLS (top bar)
          Shows: "Amazon visiting · 3 days left", etc.
      ══════════════════════════════════════ */}
      {notifications.length > 0 && (
        <div className="dashboard-pills">
          {notifications.map((n, i) => (
            <span key={i} className={`pill ${getPillClass(n.type)}`}>
              {/* Colored dot */}
              <span className="pill-dot" />
              {n.message}
            </span>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          STATS CARDS ROW
          DSA Solved | Companies | Applications | Rating
      ══════════════════════════════════════ */}
      <div className="stats-grid">

        {/* ── DSA Solved card ── */}
        <div className="stat-card">
          <span className="stat-label">DSA Solved</span>
          <span className="stat-value stat-value--green">
            {stats.dsaSolved}
          </span>
          <span className="stat-sub">of {stats.dsaTotal} questions</span>
        </div>

        {/* ── Companies card ── */}
        <div className="stat-card">
          <span className="stat-label">Companies</span>
          <span className="stat-value stat-value--blue">
            {stats.companies}
          </span>
          <span className="stat-sub">visiting campus</span>
        </div>

        {/* ── Applications card ── */}
        <div className="stat-card">
          <span className="stat-label">Applications</span>
          <span className="stat-value stat-value--red">
            {stats.applications}
          </span>
          <span className="stat-sub">submitted</span>
        </div>

        {/* ── Rating card ── */}
        <div className="stat-card">
          <span className="stat-label">Rating</span>
          <span className="stat-value stat-value--purple">
            {stats.rating}
          </span>
          <span className="stat-sub">ELO score</span>
        </div>

      </div>

      {/* ══════════════════════════════════════
          MIDDLE ROW: DSA Progress + Upcoming Companies
      ══════════════════════════════════════ */}
      <div className="mid-grid">

        {/* ── DSA Progress donut chart ── */}
        <div className="card">
          <h2 className="card-title">DSA Progress</h2>
          <div className="donut-wrapper">
            {/* SVG donut — separate component */}
            <DonutChart
              easy={dsaProgress.easy}
              medium={dsaProgress.medium}
              hard={dsaProgress.hard}
              total={dsaProgress.total}
            />
            {/* Legend: Easy / Medium / Hard */}
            <div className="donut-legend">
              <span className="legend-item">
                <span className="legend-dot legend-dot--green" />
                Easy · {dsaProgress.easy}
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--yellow" />
                Medium · {dsaProgress.medium}
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--red" />
                Hard · {dsaProgress.hard}
              </span>
            </div>
          </div>
        </div>

        {/* ── Upcoming Companies list ── */}
        <div className="card">
          <h2 className="card-title">Upcoming Companies</h2>

          {upcomingCompanies.length === 0 ? (
            // Empty state when no companies are scheduled
            <p className="empty-state">No upcoming company visits scheduled.</p>
          ) : (
            <ul className="company-list">
              {upcomingCompanies.map((company) => (
                <li key={company.id} className="company-item">
                  {/* Company name */}
                  <span className="company-name">{company.name}</span>

                  {/* Right side: role tag + days left */}
                  <div className="company-meta">
                    {/* Role badge: SDE / Intern / Analyst */}
                    <span className={`tag ${getRoleTagClass(company.roleType)}`}>
                      {company.roleType}
                    </span>
                    {/* Days countdown */}
                    <span className="company-days">
                      {formatDaysLeft(company.daysLeft)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════
          RECENT ACTIVITY FEED
      ══════════════════════════════════════ */}
      <div className="card">
        <h2 className="card-title">Recent Activity</h2>

        {recentActivity.length === 0 ? (
          // Empty state
          <p className="empty-state">
            No activity yet. Start solving DSA questions or apply to companies!
          </p>
        ) : (
          <ul className="activity-list">
            {recentActivity.map((item, i) => (
              <li key={i} className="activity-item">
                {/* Type icon (colored) */}
                <ActivityIcon type={item.type} />

                {/* Description text */}
                <span className="activity-desc">{item.description}</span>

                {/* Time ago on the right */}
                <span className="activity-time">
                  {timeAgo(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default Dashboard;