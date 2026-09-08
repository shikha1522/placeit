// experiencesController.js
// Handles interview-experience sharing: browse feed, post, edit/delete own, upvote

import pool from '../config/db.js';

// ─── GET /api/experiences ──────────────────────────────────────
// returns feed of all shared experiences with optional filters
// ?company_id=3  ?offer_received=true  ?sort=top  (default sort = recent)
export const getAllExperiences = async (req, res) => {
  try {
    const { company_id, offer_received, sort } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT e.*, c.name AS company_name, u.name AS author_name
      FROM experiences e
      JOIN companies c ON c.id = e.company_id
      JOIN users u ON u.id = e.user_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (company_id) {
      query += ` AND e.company_id = $${i++}`;
      params.push(company_id);
    }
    if (offer_received === 'true' || offer_received === 'false') {
      query += ` AND e.offer_received = $${i++}`;
      params.push(offer_received === 'true');
    }

    // sort=top → most upvoted first, otherwise most recent first
    query += sort === 'top'
      ? ` ORDER BY e.upvotes DESC, e.created_at DESC`
      : ` ORDER BY e.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, count: result.rows.length, experiences: result.rows });
  } catch (err) {
    console.error('getAllExperiences error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/experiences/mine ─────────────────────────────────
// returns only the logged-in user's own posted experiences (for edit/delete)
export const getMyExperiences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT e.*, c.name AS company_name
       FROM experiences e
       JOIN companies c ON c.id = e.company_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );

    res.json({ success: true, experiences: result.rows });
  } catch (err) {
    console.error('getMyExperiences error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/experiences/:id ───────────────────────────────────
// returns full detail of one experience
export const getExperienceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.*, c.name AS company_name, u.name AS author_name
       FROM experiences e
       JOIN companies c ON c.id = e.company_id
       JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    res.json({ success: true, experience: result.rows[0] });
  } catch (err) {
    console.error('getExperienceById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/experiences ───────────────────────────────────────
// logged-in user shares a new interview experience
export const createExperience = async (req, res) => {
  try {
    const {
      company_id, title, content, rounds_detail,
      offer_received, ctc_offered,
    } = req.body;

    if (!company_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'company_id, title, and content are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO experiences
        (user_id, company_id, title, content, rounds_detail,
         offer_received, ctc_offered, upvotes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0)
       RETURNING *`,
      [
        req.user.id, company_id, title, content, rounds_detail || null,
        offer_received || false, ctc_offered || null,
      ]
    );

    res.status(201).json({ success: true, experience: result.rows[0] });
  } catch (err) {
    console.error('createExperience error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── PUT /api/experiences/:id ─────────────────────────────────────
// only the original author (or admin) can edit
export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_id, title, content, rounds_detail,
      offer_received, ctc_offered,
    } = req.body;

    // check ownership first
    const existing = await pool.query(`SELECT user_id FROM experiences WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    const isOwner = existing.rows[0].user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this experience' });
    }

    const result = await pool.query(
      `UPDATE experiences SET
        company_id=$1, title=$2, content=$3, rounds_detail=$4,
        offer_received=$5, ctc_offered=$6
       WHERE id=$7
       RETURNING *`,
      [company_id, title, content, rounds_detail || null, offer_received || false, ctc_offered || null, id]
    );

    res.json({ success: true, experience: result.rows[0] });
  } catch (err) {
    console.error('updateExperience error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE /api/experiences/:id ──────────────────────────────────
// only the original author (or admin) can delete
export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT user_id FROM experiences WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    const isOwner = existing.rows[0].user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this experience' });
    }

    await pool.query(`DELETE FROM experiences WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Experience deleted successfully' });
  } catch (err) {
    console.error('deleteExperience error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/experiences/:id/upvote ─────────────────────────────
// increments the upvote count by 1
// NOTE: schema has no upvotes-tracking table, so this can't stop one user
// from upvoting multiple times server-side — frontend disables the button
// after a click (tracked in local component state) as a soft guard
export const upvoteExperience = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE experiences SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    res.json({ success: true, experience: result.rows[0] });
  } catch (err) {
    console.error('upvoteExperience error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};