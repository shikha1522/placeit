// Sidebar.jsx
// Left navigation panel with logo, nav links, and user info at bottom
// Responsive: fixed on desktop, slides in on mobile

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Sidebar.css";

// ── SVG icon components (inline, no extra icon lib needed) ──

// Dashboard home icon
const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

// Code/DSA icon
const IconCode = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

// Companies/building icon
const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 21h18M9 21V7l6-4v18M9 7H3v14M15 11h2M15 15h2M9 11H7M9 15H7"/>
  </svg>
);

// Resume/file icon
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

// Applications/briefcase icon
const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12.01"/>
  </svg>
);

// Contests/trophy icon
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4"/>
    <path d="M6 5v4a6 6 0 0012 0V5H6z"/>
    <line x1="12" y1="15" x2="12" y2="19"/><line x1="8" y1="19" x2="16" y2="19"/>
  </svg>
);

// Experiences/chat icon
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

// Leaderboard/bar chart icon
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

// Profile/user icon
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ── Navigation items array ──
// Each item: { path, label, Icon }
const NAV_ITEMS = [
  { path: "/dashboard",      label: "Dashboard",   Icon: IconDashboard },
  { path: "/dsa",            label: "DSA Practice", Icon: IconCode },
  { path: "/companies",      label: "Companies",    Icon: IconBuilding },
  { path: "/resume",         label: "Resume",       Icon: IconFile },
  { path: "/applications",   label: "Applications", Icon: IconBriefcase },
  { path: "/contests",       label: "Contests",     Icon: IconTrophy },
  { path: "/experiences",    label: "Experiences",  Icon: IconChat },
  { path: "/leaderboard",    label: "Leaderboard",  Icon: IconChart },
  { path: "/profile",        label: "Profile",      Icon: IconUser },
];

const Sidebar = ({ isOpen, onClose }) => {
  // Get current user from AuthContext
  const { user } = useAuth();

  return (
    // isOpen adds 'open' class → slides in on mobile via CSS transform
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>

      {/* ── Logo area ── */}
      <div className="sidebar-logo">
        {/* "place" in white, "IT" in accent blue */}
        <span className="logo-text">
          place<span className="logo-accent">IT</span>
        </span>
      </div>

      {/* ── Navigation links ── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            // NavLink auto-adds 'active' class when route matches
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
            }
            onClick={onClose} // close sidebar on mobile when link clicked
          >
            {/* Icon */}
            <span className="sidebar-link-icon">
              <Icon />
            </span>
            {/* Label */}
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── User info at bottom of sidebar ── */}
      <div className="sidebar-user">
        {/* Avatar circle with initials */}
        <div className="sidebar-avatar">
          {/* Show first letter of user's name */}
          {(user?.name || "S")[0].toUpperCase()}
        </div>
        {/* Name + branch */}
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">
            {user?.name || "Student"}
          </span>
          <span className="sidebar-user-branch">
            {user?.role || "student"} • {user?.branch || "CSE"}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;