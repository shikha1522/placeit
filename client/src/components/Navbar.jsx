// Navbar.jsx
// Top navigation bar shown on all protected pages
// Contains: hamburger (mobile), page title, date, and logout button

import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

// ── Hamburger icon (mobile only) ──
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

// ── Logout icon ──
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Map route paths to human-readable page titles ──
const PAGE_TITLES = {
  "/dashboard":    "Dashboard",
  "/dsa":          "DSA Practice",
  "/companies":    "Companies",
  "/resume":       "Resume",
  "/applications": "Applications",
  "/contests":     "Contests",
  "/experiences":  "Experiences",
  "/leaderboard":  "Leaderboard",
  "/profile":      "Profile",
};

// ── Helper: get today's date as "Thursday, June 11" ──
const getTodayDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine page title from current route
  const pageTitle = PAGE_TITLES[location.pathname] || "placeIT";

  // Handle logout: clear auth + redirect to login
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      {/* ── Left: hamburger (mobile) ── */}
      <button
        className="navbar-menu-btn"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <IconMenu />
      </button>

      {/* ── Center: Welcome message + date (dashboard only) or page title ── */}
      <div className="navbar-center">
        {location.pathname === "/dashboard" ? (
          // Dashboard shows "Welcome back, Name 👋"
          <div className="navbar-welcome">
            <h1 className="navbar-title">
              Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋
            </h1>
            {/* Show today's date */}
            <span className="navbar-date">{getTodayDate()}</span>
          </div>
        ) : (
          // Other pages just show the page name
          <h1 className="navbar-title">{pageTitle}</h1>
        )}
      </div>

      {/* ── Right: logout button ── */}
      <div className="navbar-right">
        <button
          className="navbar-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <IconLogout />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;