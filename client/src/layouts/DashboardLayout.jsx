// DashboardLayout.jsx
// The main shell layout used by ALL protected pages
// Contains: Sidebar (left) + Top Navbar + Page content (right)
// This component wraps every page after login using React Router's <Outlet />

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardLayout.css";

const DashboardLayout = () => {
  // sidebarOpen controls the mobile hamburger toggle
  // On desktop: sidebar is always visible
  // On mobile: sidebar slides in/out
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar open/close (used by hamburger button in Navbar)
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Close sidebar when user clicks a nav link on mobile
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout-root">
      {/* ── Sidebar ── */}
      {/* On mobile: overlay class added when open */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* ── Dark overlay behind sidebar on mobile ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Right side: Navbar + Page content ── */}
      <div className="layout-main">
        {/* Top navbar — receives toggle fn for hamburger */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Page content — React Router renders the matched page here */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;