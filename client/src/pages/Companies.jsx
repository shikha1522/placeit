import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Companies.css';

// ── Company status badge colors ──
const STATUS_COLORS = {
  upcoming: 'blue',
  ongoing:  'green',
  closed:   'red',
};

// ── Add/Edit Company Modal ──
const CompanyModal = ({ company, onClose, onSave, token }) => {
  const [form, setForm]         = useState({
    name: '', description: '', role: '', ctc_min: '', ctc_max: '',
    location: '', status: 'upcoming', drive_date: '', bond_years: 0,
    min_cgpa: '', max_backlogs: 0,
    eligible_branches: [], rounds: [],
    ...company, // prefill if editing
  });
  const [saving, setSaving]     = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [roundInput, setRoundInput]   = useState('');

  const BRANCHES = ['CSE','IT','ECE','EEE','ME','CE','AIDS','AIML'];

  // handle simple field change
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // toggle branch checkbox
  const toggleBranch = (b) => {
    setForm(prev => ({
      ...prev,
      eligible_branches: prev.eligible_branches.includes(b)
        ? prev.eligible_branches.filter(x => x !== b)
        : [...prev.eligible_branches, b],
    }));
  };

  // add interview round
  const addRound = () => {
    const trimmed = roundInput.trim();
    if (!trimmed || form.rounds.includes(trimmed)) return;
    setForm(prev => ({ ...prev, rounds: [...prev.rounds, trimmed] }));
    setRoundInput('');
  };

  // remove round
  const removeRound = (r) => {
    setForm(prev => ({ ...prev, rounds: prev.rounds.filter(x => x !== r) }));
  };

  // ── AI Autofill ──
  const handleAutofill = async () => {
    if (!form.name) return alert('Enter company name first');
    setAutofilling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/companies/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ company_name: form.name }),
      });
      const data = await res.json();
      if (res.ok) {
        // merge autofill into form — keep name, let AI fill rest
        setForm(prev => ({ ...prev, ...data.autofill }));
      }
    } catch (err) {
      console.error('autofill error:', err);
    } finally {
      setAutofilling(false);
    }
  };

  // ── Save company ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const url    = company?.id
        ? `${import.meta.env.VITE_API_URL}/api/companies/${company.id}`
        :`${import.meta.env.VITE_API_URL}/api/companies`;
      const method = company?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) onSave(data.company);
    } catch (err) {
      console.error('save company error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    // modal backdrop
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="modal-header">
          <h2 className="modal-title">{company?.id ? 'Edit Company' : 'Add Company'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* company name + autofill button */}
          <div className="modal-name-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Company name *</label>
              <input className="form-input" name="name" value={form.name}
                onChange={handleChange} placeholder="e.g. Google" />
            </div>
            {/* AI autofill button — only shown for new companies */}
            {!company?.id && (
              <button
                className="btn-autofill"
                onClick={handleAutofill}
                disabled={autofilling}
              >
                {autofilling ? '⏳ Filling...' : '✨ AI Autofill'}
              </button>
            )}
          </div>

          {/* description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" name="description"
              value={form.description} onChange={handleChange}
              placeholder="Company overview..." rows={3} />
          </div>

          {/* role + location */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Role offered</label>
              <input className="form-input" name="role" value={form.role}
                onChange={handleChange} placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" name="location" value={form.location}
                onChange={handleChange} placeholder="e.g. Bangalore" />
            </div>
          </div>

          {/* CTC range */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">CTC Min (LPA)</label>
              <input className="form-input" type="number" name="ctc_min"
                value={form.ctc_min} onChange={handleChange} placeholder="e.g. 8" />
            </div>
            <div className="form-group">
              <label className="form-label">CTC Max (LPA)</label>
              <input className="form-input" type="number" name="ctc_max"
                value={form.ctc_max} onChange={handleChange} placeholder="e.g. 20" />
            </div>
          </div>

          {/* status + drive date + bond */}
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" name="status"
                value={form.status} onChange={handleChange}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Drive date</label>
              <input className="form-input" type="date" name="drive_date"
                value={form.drive_date?.slice(0,10) || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Bond (years)</label>
              <input className="form-input" type="number" name="bond_years"
                value={form.bond_years} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* eligibility */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Min CGPA</label>
              <input className="form-input" type="number" step="0.1" name="min_cgpa"
                value={form.min_cgpa} onChange={handleChange} placeholder="e.g. 7.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Max backlogs allowed</label>
              <input className="form-input" type="number" name="max_backlogs"
                value={form.max_backlogs} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* eligible branches */}
          <div className="form-group">
            <label className="form-label">Eligible branches</label>
            <div className="branch-grid">
              {BRANCHES.map(b => (
                <label key={b} className="branch-check">
                  <input type="checkbox"
                    checked={form.eligible_branches?.includes(b)}
                    onChange={() => toggleBranch(b)} />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {/* interview rounds */}
          <div className="form-group">
            <label className="form-label">Interview rounds</label>
            <div className="skill-add-row">
              <input className="form-input" value={roundInput}
                onChange={e => setRoundInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRound()}
                placeholder="e.g. DSA Round" />
              <button className="btn-primary" onClick={addRound}>+ Add</button>
            </div>
            <div className="rounds-list">
              {form.rounds?.map((r, i) => (
                <span key={r} className="round-tag">
                  <span className="round-num">{i + 1}</span>
                  {r}
                  <button className="skill-remove" onClick={() => removeRound(r)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : company?.id ? 'Save changes' : 'Add company'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Company Detail Modal ──
const DetailModal = ({ company, onClose, user }) => {
  if (!company) return null;

  // eligibility check
  const branchOk  = company.eligible_branches?.includes(user?.branch);
  const cgpaOk    = parseFloat(user?.cgpa) >= parseFloat(company.min_cgpa);
  const backlogOk = (user?.backlogs || 0) <= (company.max_backlogs || 0);
  const eligible  = branchOk && cgpaOk && backlogOk;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box--detail" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{company.name}</h2>
            <span className={`status-badge status-${STATUS_COLORS[company.status]}`}>
              {company.status}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* eligibility banner */}
          <div className={`eligibility-banner ${eligible ? 'eligible' : 'not-eligible'}`}>
            <span className="eligibility-icon">{eligible ? '✓' : '✗'}</span>
            <div>
              <p className="eligibility-title">
                {eligible ? 'You are eligible for this drive' : 'You are not eligible'}
              </p>
              {!eligible && (
                <ul className="eligibility-reasons">
                  {!branchOk  && <li>Branch {user?.branch} not in eligible list</li>}
                  {!cgpaOk    && <li>Min CGPA {company.min_cgpa} required (yours: {user?.cgpa})</li>}
                  {!backlogOk && <li>Max {company.max_backlogs} backlogs allowed (yours: {user?.backlogs})</li>}
                </ul>
              )}
            </div>
          </div>

          {/* detail grid */}
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">{company.role || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">CTC Range</span>
              <span className="detail-value ctc-value">
                {company.ctc_min}–{company.ctc_max} LPA
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">{company.location || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Drive Date</span>
              <span className="detail-value">
                {company.drive_date
                  ? new Date(company.drive_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                  : 'TBD'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Min CGPA</span>
              <span className="detail-value">{company.min_cgpa}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bond</span>
              <span className="detail-value">
                {company.bond_years ? `${company.bond_years} year${company.bond_years > 1 ? 's' : ''}` : 'None'}
              </span>
            </div>
          </div>

          {/* description */}
          {company.description && (
            <div className="detail-section">
              <h4 className="detail-section-title">About the company</h4>
              <p className="detail-description">{company.description}</p>
            </div>
          )}

          {/* eligible branches */}
          {company.eligible_branches?.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">Eligible branches</h4>
              <div className="tag-row">
                {company.eligible_branches.map(b => (
                  <span key={b} className={`branch-tag ${b === user?.branch ? 'branch-tag--match' : ''}`}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* rounds */}
          {company.rounds?.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">Interview rounds</h4>
              <div className="rounds-detail">
                {company.rounds.map((r, i) => (
                  <div key={r} className="round-detail-item">
                    <span className="round-num">{i + 1}</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════
// ── Main Companies Page ──
// ══════════════════════════════════════
const Companies = () => {
  const { token, user } = useAuth();

  const [companies, setCompanies]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filters, setFilters]         = useState({ status: '', branch: '', min_ctc: '' });
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editCompany, setEditCompany]       = useState(null);
  const [detailCompany, setDetailCompany]   = useState(null);
  const [message, setMessage]               = useState(null);

  const isAdmin = user?.role === 'admin'; // show admin controls only if admin

  // ── Fetch companies ──
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // build query string from filters
      const params = new URLSearchParams();
      if (filters.status)   params.append('status',   filters.status);
      if (filters.branch)   params.append('branch',   filters.branch);
      if (filters.min_ctc)  params.append('min_ctc',  filters.min_ctc);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/companies?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setCompanies(data.companies);
    } catch (err) {
      console.error('fetchCompanies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, [filters]); // refetch on filter change

  // ── Show toast ──
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ── After save (add or edit) ──
  const handleSaved = (savedCompany) => {
    setCompanies(prev => {
      const exists = prev.find(c => c.id === savedCompany.id);
      return exists
        ? prev.map(c => c.id === savedCompany.id ? savedCompany : c) // update
        : [savedCompany, ...prev]; // prepend new
    });
    setShowAddModal(false);
    setEditCompany(null);
    showMessage(editCompany ? 'Company updated ✓' : 'Company added ✓');
  };

  // ── Delete company ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/companies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.id !== id));
        showMessage('Company deleted');
      }
    } catch (err) {
      console.error('delete error:', err);
    }
  };

  // ── Client-side search filter ──
  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="companies-page">

      {/* toast */}
      {message && (
        <div className={`profile-toast ${message.type}`}>{message.text}</div>
      )}

      {/* modals */}
      {(showAddModal || editCompany) && (
        <CompanyModal
          company={editCompany}
          token={token}
          onClose={() => { setShowAddModal(false); setEditCompany(null); }}
          onSave={handleSaved}
        />
      )}
      {detailCompany && (
        <DetailModal
          company={detailCompany}
          user={user}
          onClose={() => setDetailCompany(null)}
        />
      )}

      {/* ── Page header ── */}
      <div className="profile-header">
        <div className="companies-header-row">
          <div>
            <h1 className="profile-title">Companies</h1>
            <p className="profile-subtitle">
              {filtered.length} compan{filtered.length === 1 ? 'y' : 'ies'} listed
            </p>
          </div>
          {/* add button — admin only */}
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              + Add Company
            </button>
          )}
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="companies-filters">
        {/* search */}
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" width="15" height="15">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="form-input search-input"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* status filter */}
        <select className="form-input filter-select"
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="closed">Closed</option>
        </select>

        {/* branch filter */}
        <select className="form-input filter-select"
          value={filters.branch}
          onChange={e => setFilters(p => ({ ...p, branch: e.target.value }))}>
          <option value="">All branches</option>
          {['CSE','IT','ECE','EEE','ME','CE','AIDS','AIML'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* min CTC filter */}
        <select className="form-input filter-select"
          value={filters.min_ctc}
          onChange={e => setFilters(p => ({ ...p, min_ctc: e.target.value }))}>
          <option value="">Any CTC</option>
          <option value="3">3+ LPA</option>
          <option value="5">5+ LPA</option>
          <option value="10">10+ LPA</option>
          <option value="20">20+ LPA</option>
        </select>
      </div>

      {/* ── Company cards grid ── */}
      {filtered.length === 0 ? (
        <div className="companies-empty">
          <p>No companies found</p>
        </div>
      ) : (
        <div className="companies-grid">
          {filtered.map(company => {
            // quick eligibility check for card highlight
            const branchOk  = company.eligible_branches?.includes(user?.branch);
            const cgpaOk    = parseFloat(user?.cgpa) >= parseFloat(company.min_cgpa);
            const backlogOk = (user?.backlogs || 0) <= (company.max_backlogs || 0);
            const eligible  = branchOk && cgpaOk && backlogOk;

            return (
              <div
                key={company.id}
                className={`company-card ${eligible ? 'company-card--eligible' : ''}`}
                onClick={() => setDetailCompany(company)}
              >
                {/* card top: name + status */}
                <div className="company-card-top">
                  {/* company initial avatar */}
                  <div className="company-avatar">
                    {company.name[0].toUpperCase()}
                  </div>
                  <div className="company-card-info">
                    <h3 className="company-name">{company.name}</h3>
                    <p className="company-role">{company.role}</p>
                  </div>
                  <span className={`status-badge status-${STATUS_COLORS[company.status]}`}>
                    {company.status}
                  </span>
                </div>

                {/* CTC + location */}
                <div className="company-card-meta">
                  <span className="meta-item">
                    💰 {company.ctc_min}–{company.ctc_max} LPA
                  </span>
                  <span className="meta-item">
                    📍 {company.location || 'TBD'}
                  </span>
                  {company.drive_date && (
                    <span className="meta-item">
                      📅 {new Date(company.drive_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </span>
                  )}
                </div>

                {/* eligibility pill */}
                <div className="company-card-footer">
                  <span className={`eligibility-pill ${eligible ? 'pill-green' : 'pill-red'}`}>
                    {eligible ? '✓ Eligible' : '✗ Not eligible'}
                  </span>
                  <span className="company-card-cgpa">
                    CGPA {company.min_cgpa}+
                  </span>

                  {/* admin controls — stop propagation so card click doesn't open detail */}
                  {isAdmin && (
                    <div className="admin-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon btn-icon--edit"
                        onClick={() => setEditCompany(company)}>✏️</button>
                      <button className="btn-icon btn-icon--delete"
                        onClick={() => handleDelete(company.id)}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Companies;