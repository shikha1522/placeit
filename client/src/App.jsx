// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { useAuth } from './context/AuthContext';

// ── Layouts ──
import DashboardLayout from './layouts/DashboardLayout';

// ── Public pages (already exist) ──
import Login from './pages/Login';
import Register from './pages/Register';

// ── Protected pages (new) ──
import Dashboard from './pages/Dashboard';

// ── Placeholder for future phases ──
const ComingSoon = ({ page }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '60vh', flexDirection: 'column', gap: '12px'
  }}>
    <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>{page}</h2>
    <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>Coming soon...</p>
  </div>
);

// ── PrivateRoute: if no token → redirect to /login ──
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes (same as before) ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Protected routes (NEW) ── */}
        {/* DashboardLayout renders Sidebar + Navbar + <Outlet /> */}
        {/* Every child page renders inside that <Outlet /> */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/dsa"          element={<ComingSoon page="DSA Practice" />} />
          <Route path="/companies"    element={<ComingSoon page="Companies" />} />
          <Route path="/resume"       element={<ComingSoon page="Resume" />} />
          <Route path="/applications" element={<ComingSoon page="Applications" />} />
          <Route path="/contests"     element={<ComingSoon page="Contests" />} />
          <Route path="/experiences"  element={<ComingSoon page="Experiences" />} />
          <Route path="/leaderboard"  element={<ComingSoon page="Leaderboard" />} />
          <Route path="/profile"      element={<ComingSoon page="Profile" />} />
        </Route>

        {/* ── 404 fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;