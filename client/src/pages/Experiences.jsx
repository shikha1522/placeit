import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Experiences.css';
import env from 'dotenv';
env.config();

// ── Post / Edit Experience Modal ──
const ExperienceModal = ({ experience, companies, onClose, onSave, token }) => {
  const [form, setForm] = useState({
    company_id: '', title: '', content: '', rounds_detail: '',
    offer_received: false, ctc_offered: '',
    ...experience,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.company_id || !form.title || !form.content) {
      alert('Company, title, and your experience write-up are required');
      return;
    }
    setSaving(true);
    try {
      const url = experience?.id
        ? `${import.meta.env.VITE_API_URL}/api/experiences/${experience.id}`
        : `${import.meta.env.VITE_API_URL}/api/experiences`;
      const method = experience?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          ctc_offered: form.ctc_offered || null,
        }),
      });
      const data = await res.json();
      if (res.ok) onSave(data.experience);
      else alert(data.message || 'Failed to save experience');
    } catch (err) {
      console.error('save experience error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{experience?.id ? 'Edit Experience' : 'Share Your Experience'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Company *</label>
              <select className="form-input" name="company_id"
                value={form.company_id} onChange={handleChange}>
                <option value="">Select company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Outcome</label>
              <select className="form-input" name="offer_received"
                value={form.offer_received ? 'true' : 'false'}
                onChange={e => setForm(p => ({ ...p, offer_received: e.target.value === 'true' }))}>
                <option value="false">Not selected</option>
                <option value="true">Offer received</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title}
              onChange={handleChange} placeholder="e.g. My Google SDE-1 interview experience" />
          </div>

          {form.offer_received && (
            <div className="form-group">
              <label className="form-label">CTC offered (LPA)</label>
              <input className="form-input" type="number" step="0.1" name="ctc_offered"
                value={form.ctc_offered} onChange={handleChange} placeholder="e.g. 12" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Round-by-round breakdown</label>
            <textarea className="form-input form-textarea" name="rounds_detail"
              value={form.rounds_detail || ''} onChange={handleChange}
              placeholder="Round 1: Online assessment - 2 DSA questions...
Round 2: Technical interview - ..."
              rows={4} />
          </div>

          <div className="form-group">
            <label className="form-label">Your full experience *</label>
            <textarea className="form-input form-textarea" name="content"
              value={form.content} onChange={handleChange}
              placeholder="Share how the process went, what to prepare, tips for others..."
              rows={6} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Experience Detail Modal ──
const DetailModal = ({ experience, isOwner, onClose, onEdit, onDelete }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-box modal-box--detail" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">{experience.title}</h2>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body">
        <div className="exp-detail-meta">
          <span className="exp-company">{experience.company_name}</span>
          <span className={`status-badge ${experience.offer_received ? 'status-green' : 'status-red'}`}>
            {experience.offer_received ? '✓ Offer received' : 'Not selected'}
          </span>
          {experience.offer_received && experience.ctc_offered && (
            <span className="meta-item">💰 {experience.ctc_offered} LPA</span>
          )}
        </div>
        <p className="exp-author">by {experience.author_name} · {new Date(experience.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

        {experience.rounds_detail && (
          <>
            <h4 className="exp-section-title">Round-by-round</h4>
            <p className="exp-body">{experience.rounds_detail}</p>
          </>
        )}

        <h4 className="exp-section-title">Full experience</h4>
        <p className="exp-body">{experience.content}</p>
      </div>

      {isOwner && (
        <div className="modal-footer">
          <button className="btn-danger" onClick={() => onDelete(experience.id)}>Delete</button>
          <button className="btn-primary" onClick={() => onEdit(experience)}>Edit</button>
        </div>
      )}
    </div>
  </div>
);

const Experiences = () => {
  const { user, token } = useAuth();

  const [experiences, setExperiences] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all | mine
  const [filters, setFilters] = useState({ company_id: '', offer_received: '', sort: 'recent' });
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editExperience, setEditExperience] = useState(null);
  const [detailExperience, setDetailExperience] = useState(null);
  const [upvoted, setUpvoted] = useState(new Set()); // soft client-side guard against double-upvote

  const [message, setMessage] = useState(null);
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ── Fetch experiences (all or mine) ──
  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'mine'
        ? `${import.meta.env.VITE_API_URL}/api/experiences/mine`
        : (() => {
            const params = new URLSearchParams();
            if (filters.company_id) params.set('company_id', filters.company_id);
            if (filters.offer_received) params.set('offer_received', filters.offer_received);
            if (filters.sort === 'top') params.set('sort', 'top');
            const qs = params.toString();
            return `${import.meta.env.VITE_API_URL}/api/experiences${qs ? `?${qs}` : ''}`;
          })();

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setExperiences(data.experiences || []);
    } catch (err) {
      console.error('fetch experiences error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch companies for the dropdown/filter ──
  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('[DEBUG] companies fetch status:', res.status, 'data:', data);
      if (res.ok) setCompanies(data.companies || []);
    } catch (err) {
      console.error('fetch companies error:', err);
    }
  };

  // token starts out null until AuthContext finishes restoring it from
  // localStorage on page load — wait for it before firing requests, and
  // re-fetch if it changes (e.g. login happens after this page mounted)
  useEffect(() => { if (token) fetchCompanies(); }, [token]);
  useEffect(() => { if (token) fetchExperiences(); }, [token, tab, filters.company_id, filters.offer_received, filters.sort]);

  // ── Upvote ──
  const handleUpvote = async (id, e) => {
    e.stopPropagation();
    if (upvoted.has(id)) return; // soft guard: one upvote per session per card
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/experiences/${id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setExperiences(prev => prev.map(exp => exp.id === id ? { ...exp, upvotes: data.experience.upvotes } : exp));
        setUpvoted(prev => new Set(prev).add(id));
      }
    } catch (err) {
      console.error('upvote error:', err);
    }
  };

  // ── Save (create/edit) ──
  const handleSaved = (saved) => {
    setExperiences(prev => {
      const exists = prev.find(e => e.id === saved.id);
      // saved payload from API doesn't include joined company_name/author_name,
      // so merge with existing entry (or refetch) to keep the card display correct
      if (exists) return prev.map(e => e.id === saved.id ? { ...e, ...saved } : e);
      const companyName = companies.find(c => c.id === Number(saved.company_id))?.name;
      return [{ ...saved, company_name: companyName, author_name: user?.name }, ...prev];
    });
    setShowAddModal(false);
    setEditExperience(null);
    setDetailExperience(null);
    showMessage(editExperience ? 'Experience updated ✓' : 'Experience shared ✓');
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experience?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/experiences/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setExperiences(prev => prev.filter(e => e.id !== id));
        setDetailExperience(null);
        showMessage('Experience deleted');
      }
    } catch (err) {
      console.error('delete experience error:', err);
    }
  };

  // ── Client-side search on top of server filters ──
  const filtered = experiences.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading experiences...</p>
      </div>
    );
  }

  return (
    <div className="experiences-page">
      {message && <div className={`profile-toast ${message.type}`}>{message.text}</div>}

      {(showAddModal || editExperience) && (
        <ExperienceModal
          experience={editExperience}
          companies={companies}
          token={token}
          onClose={() => { setShowAddModal(false); setEditExperience(null); }}
          onSave={handleSaved}
        />
      )}

      {detailExperience && (
        <DetailModal
          experience={detailExperience}
          isOwner={detailExperience.user_id === user?.id}
          onClose={() => setDetailExperience(null)}
          onEdit={(exp) => { setEditExperience(exp); setDetailExperience(null); }}
          onDelete={handleDelete}
        />
      )}

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="companies-header-row">
          <div>
            <h1 className="profile-title">Experiences</h1>
            <p className="profile-subtitle">
              {filtered.length} experience{filtered.length === 1 ? '' : 's'} shared
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Share Experience
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="exp-tabs">
        <button className={`exp-tab ${tab === 'all' ? 'exp-tab--active' : ''}`} onClick={() => setTab('all')}>
          All Experiences
        </button>
        <button className={`exp-tab ${tab === 'mine' ? 'exp-tab--active' : ''}`} onClick={() => setTab('mine')}>
          My Experiences
        </button>
      </div>

      {/* ── Search + Filters (only for the shared feed) ── */}
      {tab === 'all' && (
        <div className="companies-filters">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" width="15" height="15">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="form-input search-input" placeholder="Search by title or company..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="form-input filter-select" value={filters.company_id}
            onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="form-input filter-select" value={filters.offer_received}
            onChange={e => setFilters(p => ({ ...p, offer_received: e.target.value }))}>
            <option value="">Any outcome</option>
            <option value="true">Offer received</option>
            <option value="false">Not selected</option>
          </select>

          <select className="form-input filter-select" value={filters.sort}
            onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}>
            <option value="recent">Most recent</option>
            <option value="top">Most upvoted</option>
          </select>
        </div>
      )}

      {/* ── Feed ── */}
      {filtered.length === 0 ? (
        <div className="companies-empty">
          <p>{tab === 'mine' ? "You haven't shared any experiences yet" : 'No experiences found'}</p>
        </div>
      ) : (
        <div className="exp-list">
          {filtered.map(exp => (
            <div key={exp.id} className="exp-card" onClick={() => setDetailExperience(exp)}>
              <div className="exp-card-top">
                <div className="exp-card-info">
                  <h3 className="exp-title">{exp.title}</h3>
                  <p className="exp-meta-line">
                    {exp.company_name} {tab === 'all' && exp.author_name && <>· by {exp.author_name}</>}
                  </p>
                </div>
                <span className={`status-badge ${exp.offer_received ? 'status-green' : 'status-red'}`}>
                  {exp.offer_received ? '✓ Offer' : 'Not selected'}
                </span>
              </div>

              <p className="exp-preview">{exp.content}</p>

              <div className="exp-card-footer">
                {exp.offer_received && exp.ctc_offered && (
                  <span className="meta-item">💰 {exp.ctc_offered} LPA</span>
                )}
                <span className="meta-item">
                  📅 {new Date(exp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <button
                  className={`exp-upvote ${upvoted.has(exp.id) ? 'exp-upvote--active' : ''}`}
                  onClick={(e) => handleUpvote(exp.id, e)}
                >
                  ▲ {exp.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Experiences;