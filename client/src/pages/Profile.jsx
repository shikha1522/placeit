// Profile.jsx — full profile page with edit, skills, password, avatar

import { useState, useEffect, useRef } from 'react';   // react hooks
import { useAuth } from '../context/AuthContext';       // global auth state
import '../styles/Profile.css';                         // profile styles

const Profile = () => {
  const { token, user: authUser, setUser } = useAuth(); // get token + user from context

  // ── State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState('personal');  // active tab
  const [loading, setLoading]         = useState(true);        // initial load
  const [saving, setSaving]           = useState(false);       // save button state
  const [message, setMessage]         = useState(null);        // success/error message
  const [avatarPreview, setAvatarPreview] = useState(null);    // local avatar preview

  // profile form state — all fields from users + resumes tables
  const [form, setForm] = useState({
    name:            '',
    email:           '',
    branch:          '',
    cgpa:            '',
    backlogs:        '',
    graduation_year: '',
    phone:           '',
    linkedin_url:    '',
    github_url:      '',
    skills:          [],
    avatar_url:      '',
    role:            '',
    created_at:      '',
    profile_complete: false,
  });

  // password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  // skill input state
  const [skillInput, setSkillInput] = useState('');   // new skill being typed

  // file input ref for avatar upload
  const fileInputRef = useRef(null);

  // ── Fetch profile on mount ─────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);                                              // run once on mount

  // fetch profile data from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }, // send jwt token
      });
      const data = await res.json();                   // parse response

      if (res.ok) {
        // populate form with fetched data
        setForm({
          name:             data.user.name            || '',
          email:            data.user.email           || '',
          branch:           data.user.branch          || '',
          cgpa:             data.user.cgpa            || '',
          backlogs:         data.user.backlogs        ?? '',
          graduation_year:  data.user.graduation_year || '',
          phone:            data.user.phone           || '',
          linkedin_url:     data.user.linkedin_url    || '',
          github_url:       data.user.github_url      || '',
          skills:           data.user.skills          || [],
          avatar_url:       data.user.avatar_url      || '',
          role:             data.user.role            || 'student',
          created_at:       data.user.created_at      || '',
          profile_complete: data.user.profile_complete || false,
        });
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      showMessage('Failed to load profile', 'error');
    } finally {
      setLoading(false);                               // stop loading spinner
    }
  };

  // ── Show message helper ────────────────────────────────────
  // shows success or error message for 3 seconds then clears
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });                        // set message
    setTimeout(() => setMessage(null), 3000);          // clear after 3s
  };

  // ── Handle form field changes ──────────────────────────────
  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,                // update changed field
    }));
  };

  // ── Calculate profile completion % ────────────────────────
  const getCompletionPercent = () => {
    // list of fields that contribute to profile completion
    const fields = [
      form.name, form.branch, form.cgpa, form.phone,
      form.linkedin_url, form.github_url, form.graduation_year,
      form.skills.length > 0 ? 'has_skills' : '',     // skills count as one field
      form.avatar_url,                                 // avatar counts too
    ];
    const filled = fields.filter(Boolean).length;      // count non-empty fields
    return Math.round((filled / fields.length) * 100); // return percentage
  };

  // ── Save personal + academic info ─────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);                                   // show loading on button
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,            // send jwt
        },
        body: JSON.stringify({
          name:            form.name,
          branch:          form.branch,
          cgpa:            form.cgpa       || null,
          backlogs:        form.backlogs   ?? null,
          graduation_year: form.graduation_year || null,
          phone:           form.phone,
          linkedin_url:    form.linkedin_url,
          github_url:      form.github_url,
          skills:          form.skills,
        }),
      });

      const data = await res.json();                   // parse response

      if (res.ok) {
        showMessage('Profile updated successfully ✓');  // show success
        setUser(prev => ({ ...prev, ...data.user }));  // update global auth user
      } else {
        showMessage(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      console.error('saveProfile error:', err);
      showMessage('Something went wrong', 'error');
    } finally {
      setSaving(false);                                // stop loading
    }
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    // validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    // validate length
    if (passwordForm.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/profile/password', {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword:     passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage('Password changed successfully ✓');
        // clear password form after success
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage(data.error || 'Password change failed', 'error');
      }
    } catch (err) {
      showMessage('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Add skill tag ──────────────────────────────────────────
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();                 // remove whitespace
    // dont add empty or duplicate skills
    if (!trimmed || form.skills.includes(trimmed)) return;

    setForm(prev => ({
      ...prev,
      skills: [...prev.skills, trimmed],              // add new skill
    }));
    setSkillInput('');                                 // clear input
  };

  // add skill on Enter key press
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') handleAddSkill();           // add on enter
  };

  // ── Remove skill tag ───────────────────────────────────────
  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove), // remove skill
    }));
  };

  // ── Avatar upload ──────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];                    // get selected file
    if (!file) return;                                 // nothing selected

    // show local preview immediately before upload
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result); // set preview
    reader.readAsDataURL(file);                        // read file as url

    // upload to backend
    const formData = new FormData();
    formData.append('avatar', file);                   // field name must match multer

    try {
      const res = await fetch('http://localhost:5000/api/profile/avatar', {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type for FormData
        body:    formData,                             // send form data
      });

      const data = await res.json();

      if (res.ok) {
        setForm(prev => ({ ...prev, avatar_url: data.user.avatar_url })); // update url
        setUser(prev => ({ ...prev, avatar_url: data.user.avatar_url })); // update global
        showMessage('Avatar updated successfully ✓');
      } else {
        showMessage(data.error || 'Avatar upload failed', 'error');
        setAvatarPreview(null);                        // reset preview on fail
      }
    } catch (err) {
      showMessage('Upload failed', 'error');
      setAvatarPreview(null);
    }
  };

  // ── Get initials for avatar fallback ──────────────────────
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ')                             // split by space
      .map(n => n[0])                                  // take first letter
      .join('')                                        // join letters
      .toUpperCase()                                   // uppercase
      .slice(0, 2);                                    // max 2 letters
  };

  // ── Format date ───────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'long', year: 'numeric',                 // e.g. "January 2024"
    });
  };

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  const completionPercent = getCompletionPercent();   // calculate once

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* ── Toast message ── */}
      {message && (
        <div className={`profile-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your personal info, skills and account settings</p>
      </div>

      {/* ── Main grid: left panel + right panel ── */}
      <div className="profile-grid">

        {/* ════ LEFT PANEL ════ */}
        <div className="profile-left">

          {/* Avatar card */}
          <div className="profile-card avatar-card">

            {/* Avatar image or initials */}
            <div
              className="profile-avatar-wrap"
              onClick={() => fileInputRef.current.click()} // click to upload
            >
              {/* show image if exists, else show initials */}
              {(avatarPreview || form.avatar_url) ? (
                <img
                  src={avatarPreview || form.avatar_url}
                  alt="avatar"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-initials">
                  {getInitials(form.name)}
                </div>
              )}
              {/* camera icon overlay on hover */}
              <div className="profile-avatar-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>

            {/* hidden file input triggered by avatar click */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"                         // only images
              style={{ display: 'none' }}              // hidden
            />

            {/* user name + role badge */}
            <h2 className="profile-name">{form.name || 'Student'}</h2>
            <span className="profile-role-badge">{form.role}</span>

            {/* profile completion bar */}
            <div className="profile-completion">
              <div className="completion-label">
                <span>Profile complete</span>
                <span className="completion-percent">{completionPercent}%</span>
              </div>
              <div className="completion-bar">
                <div
                  className="completion-fill"
                  style={{ width: `${completionPercent}%` }}  // dynamic width
                />
              </div>
            </div>

            {/* member since */}
            <p className="profile-since">Member since {formatDate(form.created_at)}</p>
          </div>

          {/* Social links card */}
          <div className="profile-card social-card">
            <h3 className="card-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              Social links
            </h3>
                {/* github link */}
            
             <a href={form.github_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="social-link-row"
            >
              <div className="social-icon-wrap github">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <span>{form.github_url ? form.github_url.replace('https://', '') : 'Not added'}</span>
            </a>

            {/* linkedin link */}
            <a
              href={form.linkedin_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="social-link-row"
            >
              <div className="social-icon-wrap linkedin">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <span>{form.linkedin_url ? form.linkedin_url.replace('https://', '') : 'Not added'}</span>
            </a>

            {/* phone */}
            <div className="social-link-row">
              <div className="social-icon-wrap phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/>
                </svg>
              </div>
              <span>{form.phone || 'Not added'}</span>
            </div>
          </div>

        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="profile-right">

          {/* ── Tabs ── */}
          <div className="profile-tabs">
            {['personal', 'academic', 'skills', 'security'].map(tab => (
              <button
                key={tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}    // switch tab
              >
                {/* capitalize first letter */}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ══ TAB: Personal Info ══ */}
          {activeTab === 'personal' && (
            <div className="profile-card">
              <h3 className="card-section-title">Personal information</h3>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input
                    className="form-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={form.email}
                    disabled                           // email not editable
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input
                    className="form-input"
                    name="github_url"
                    value={form.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input
                  className="form-input"
                  name="linkedin_url"
                  value={form.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* save button */}
              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}                    // disable while saving
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: Academic Info ══ */}
          {activeTab === 'academic' && (
            <div className="profile-card">
              <h3 className="card-section-title">Academic information</h3>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    className="form-input"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                  >
                    <option value="">Select branch</option>
                    {['CSE','IT','ECE','EEE','ME','CE','AIDS','AIML'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Graduation year</label>
                  <select
                    className="form-input"
                    name="graduation_year"
                    value={form.graduation_year}
                    onChange={handleChange}
                  >
                    <option value="">Select year</option>
                    {[2024,2025,2026,2027,2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">CGPA</label>
                  <input
                    className="form-input"
                    name="cgpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={form.cgpa}
                    onChange={handleChange}
                    placeholder="e.g. 8.5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Active backlogs</label>
                  <input
                    className="form-input"
                    name="backlogs"
                    type="number"
                    min="0"
                    value={form.backlogs}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: Skills ══ */}
          {activeTab === 'skills' && (
            <div className="profile-card">
              <h3 className="card-section-title">Skills & tech stack</h3>

              {/* skills tags */}
              <div className="skills-container">
                {form.skills.length === 0 ? (
                  <p className="skills-empty">No skills added yet. Add your first skill below!</p>
                ) : (
                  form.skills.map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button
                        className="skill-remove"
                        onClick={() => handleRemoveSkill(skill)}  // remove on click
                      >×</button>
                    </span>
                  ))
                )}
              </div>

              {/* add skill input */}
              <div className="skill-add-row">
                <input
                  className="form-input"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}       // enter to add
                  placeholder="Type a skill and press Enter..."
                />
                <button
                  className="btn-primary"
                  onClick={handleAddSkill}
                >+ Add</button>
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save skills'}
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: Security ══ */}
          {activeTab === 'security' && (
            <div className="profile-card">
              <h3 className="card-section-title">Change password</h3>

              <div className="form-group">
                <label className="form-label">Current password</label>
                <input
                  className="form-input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">New password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm new password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              {/* password match indicator */}
              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <p className={`password-match ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? 'match' : 'no-match'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </p>
              )}

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;