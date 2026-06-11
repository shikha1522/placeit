// Login.jsx — the full login page for placeIT
// This is a React component that renders the split layout:
// left = illustration panel, right = login form

import { useState } from 'react'; // useState lets us track form input values
import { Link } from 'react-router-dom'; // Link is used instead of <a> so React handles navigation without page reload
import '../styles/Auth.css'; // all styles specific to login/register pages

const Login = () => {

  // showPassword toggles the password field between hidden and visible
  const [showPassword, setShowPassword] = useState(false);

  // formData stores what the user types into each field
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // handleChange fires on every keystroke — updates only the field that changed
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // ...formData spreads existing values so we don't lose other fields
  };

  // handleSubmit fires when user clicks Login — will call backend in Phase 3
  const handleSubmit = (e) => {
    e.preventDefault(); // prevents browser from reloading the page on form submit
    console.log('Login submitted:', formData); // placeholder until auth API is ready
  };

  return (
    <div className="auth-root">

      {/* ── LEFT PANEL ── illustration + branding */}
      <div className="auth-left">

        {/* placeIT logo — IT is blue to match the brand accent */}
        <div className="auth-logo">
          place<span>IT</span>
        </div>

            <div className="auth-badges">
        <div className="auth-badge">
            <span className="badge-dot green"></span>
            New questions · Amazon + 12
        </div>
        <div className="auth-badge">
            <span className="badge-dot blue"></span>
            Contest live · DSA Sprint #4
        </div>
        <div className="auth-badge">
            <span className="badge-dot purple"></span>
            Students placed · 240+
        </div>
        <div className="auth-badge">
            <span className="badge-dot amber"></span>
            Companies visiting · 18
        </div>
        </div>

        {/* illustration area — robot, floating orbs, screen card */}
        <div className="auth-illustration">
          <div className="illus-inner">

            {/* floating label orbs around the screen card */}
            <div className="orb orb-blue"  style={{ top: '-18px', left: '-60px' }}>DSA</div>
            <div className="orb orb-green" style={{ top: '-18px', right: '-60px' }}>HIRE</div>
            <div className="orb orb-amber" style={{ bottom: '10px', left: '-60px' }}>RANK</div>
            <div className="orb orb-purple"style={{ bottom: '10px', right: '-60px' }}>ELO</div>

            {/* robot emoji sitting above the screen card */}
            <div className="illus-robot">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* head */}
            <rect x="18" y="14" width="36" height="28" rx="10" fill="#1e1e1e" stroke="#3b82f6" strokeWidth="1.5"/>
            {/* antenna */}
            <line x1="36" y1="14" x2="36" y2="6" stroke="#3b82f6" strokeWidth="1.5"/>
            <circle cx="36" cy="5" r="3" fill="#3b82f6"/>
            {/* eyes */}
            <rect x="24" y="22" width="8" height="6" rx="2" fill="#3b82f6"/>
            <rect x="40" y="22" width="8" height="6" rx="2" fill="#a855f7"/>
            {/* smile */}
            <path d="M26 34 Q36 40 46 34" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            {/* body */}
            <rect x="22" y="44" width="28" height="18" rx="6" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1.5"/>
            {/* body lights */}
            <circle cx="30" cy="53" r="3" fill="#22c55e"/>
            <circle cx="36" cy="53" r="3" fill="#3b82f6"/>
            <circle cx="42" cy="53" r="3" fill="#a855f7"/>
            {/* arms */}
            <rect x="8" y="46" width="12" height="6" rx="3" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1.5"/>
            <rect x="52" y="46" width="12" height="6" rx="3" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1.5"/>
        </svg>
        </div>

            {/* fake dashboard card to hint at the app UI */}
            <div className="illus-card">
              <div className="illus-line"></div>
              <div className="illus-line short"></div>
              <div className="illus-btn-row">
                <div className="illus-btn green"></div>
                <div className="illus-btn blue"></div>
                <div className="illus-btn purple"></div>
              </div>
            </div>

          </div>
        </div>

        {/* tagline below the illustration */}
        <div className="auth-tagline">
          <h2>Your placement journey<br />starts here</h2>
          <p>Track companies · Solve DSA · Build resume · Compete</p>
        </div>

      </div>

      {/* ── RIGHT PANEL ── actual login form */}
      <div className="auth-right">

        <h1 className="auth-welcome">Welcome back!</h1>
        <p className="auth-sub">Sign in to your placeIT account</p>

        {/* form — onSubmit wired to handleSubmit */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* email field */}
          <div className="field-wrap">
            <label className="field-label">Email address</label>
            <input
              className="auth-input"
              type="email"
              name="email"           // must match the key in formData
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required               // browser-level validation
            />
          </div>

          {/* password field — toggleable visibility */}
          <div className="field-wrap">
            <label className="field-label">Password</label>
            <div className="pw-wrap">
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'} // switches type based on state
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {/* toggle button — changes label between show/hide */}
              <button
                type="button"              // type=button prevents form submission
                className="show-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          {/* forgot password link — will route to reset page later */}
          <div className="forgot-wrap">
            <span className="forgot-link">Forgot password?</span>
          </div>

          {/* submit button */}
          <button type="submit" className="auth-submit-btn">
            Login
          </button>

        </form>

        <div className="auth-or">or continue with</div>

        {/* social login buttons — Google and GitHub (wired in later phases) */}
        <div className="auth-social-row">
          <button className="social-btn">
            {/* Google SVG icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button className="social-btn">
            {/* GitHub SVG icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        {/* link to register page */}
        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Register here</Link>
          {/* Link from react-router-dom navigates without full page reload */}
        </p>

      </div>
    </div>
  );
};

export default Login;