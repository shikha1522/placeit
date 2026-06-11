// Register.jsx — registration page for new students
// Same split layout as Login but with extra fields: name, branch, year

import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css'; // shares the same stylesheet as Login

const Register = () => {

  const [showPassword, setShowPassword] = useState(false);

  // formData has more fields than login — name, branch, year are extra
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register submitted:', formData); // placeholder for Phase 3 API call
  };

  return (
    <div className="auth-root">

      {/* ── LEFT PANEL ── same as login */}
      <div className="auth-left">
        <div className="auth-logo">place<span>IT</span></div>

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

        <div className="auth-illustration">
          <div className="illus-inner">
            <div className="orb orb-blue"   style={{ top: '-18px', left: '-60px' }}>DSA</div>
            <div className="orb orb-green"  style={{ top: '-18px', right: '-60px' }}>HIRE</div>
            <div className="orb orb-amber"  style={{ bottom: '10px', left: '-60px' }}>RANK</div>
            <div className="orb orb-purple" style={{ bottom: '10px', right: '-60px' }}>ELO</div>
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

        <div className="auth-tagline">
          <h2>Your placement journey<br />starts here</h2>
          <p>Track companies · Solve DSA · Build resume · Compete</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── register form */}
      <div className="auth-right">

        <h1 className="auth-welcome">Create account</h1>
        <p className="auth-sub">Join placeIT and start your prep</p>

        <form onSubmit={handleSubmit} className="auth-form">

          {/* full name */}
          <div className="field-wrap">
            <label className="field-label">Full name</label>
            <input
              className="auth-input"
              type="text"
              name="name"
              placeholder="Riya Sharma"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* email */}
          <div className="field-wrap">
            <label className="field-label">Email address</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* password */}
          <div className="field-wrap">
            <label className="field-label">Password</label>
            <div className="pw-wrap">
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="show-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>
          </div>

   

          <button type="submit" className="auth-submit-btn">
            Create account
          </button>

        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Login here</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;