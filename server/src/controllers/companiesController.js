import pool from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ─── GET /api/companies ───────────────────────────────────────
// returns all companies with optional filters via query params
// ?status=upcoming  ?branch=CSE  ?min_ctc=5  ?min_cgpa=7
export const getAllCompanies = async (req, res) => {
  try {
    const { status, branch, min_ctc, max_cgpa } = req.query;

    // base query — selects core display fields for the list view
    let query = `
      SELECT id, name, role, ctc_min, ctc_max, location,
             status, drive_date, eligible_branches, min_cgpa, max_backlogs
      FROM companies
      WHERE 1=1
    `;
    // 1=1 is a trick so we can always append AND without special-casing first filter

    const params = [];
    let i = 1; // PostgreSQL uses $1, $2, ... for parameterized queries

    // dynamically append filters only if provided
    if (status) {
      query += ` AND status = $${i++}`;
      params.push(status);
    }
    if (branch) {
      // eligible_branches is an array column in postgres
      query += ` AND $${i++} = ANY(eligible_branches)`;
      params.push(branch);
    }
    if (min_ctc) {
      query += ` AND ctc_max >= $${i++}`;
      params.push(Number(min_ctc));
    }
    if (max_cgpa) {
      // filter companies the user's CGPA qualifies for
      query += ` AND min_cgpa <= $${i++}`;
      params.push(Number(max_cgpa));
    }

    query += ` ORDER BY drive_date DESC NULLS LAST`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      companies: result.rows,
    });
  } catch (err) {
    console.error('getAllCompanies error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/companies/:id ───────────────────────────────────
// returns full detail of one company + eligibility check for logged-in user
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // set by protect middleware after JWT verify

    // get full company details
    const companyResult = await pool.query(
      `SELECT * FROM companies WHERE id = $1`,
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const company = companyResult.rows[0];

    // get logged-in user's profile for eligibility check
    const userResult = await pool.query(
      `SELECT branch, cgpa, backlogs FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    // eligibility logic — check all 3 conditions
    const branchOk = company.eligible_branches?.includes(user.branch);
    const cgpaOk   = parseFloat(user.cgpa) >= parseFloat(company.min_cgpa);
    const backlogOk = (user.backlogs || 0) <= (company.max_backlogs || 0);

    const eligible = branchOk && cgpaOk && backlogOk;

    // send reasons for ineligibility so frontend can show specific message
    const eligibilityDetails = {
      eligible,
      reasons: {
        branch:  branchOk  ? null : `Your branch (${user.branch}) is not eligible`,
        cgpa:    cgpaOk    ? null : `Min CGPA required: ${company.min_cgpa}, yours: ${user.cgpa}`,
        backlog: backlogOk ? null : `Max backlogs allowed: ${company.max_backlogs}, yours: ${user.backlogs}`,
      },
    };

    res.json({ success: true, company, eligibility: eligibilityDetails });
  } catch (err) {
    console.error('getCompanyById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/companies/autofill ────────────────────────────
// admin types company name → Claude AI prefills the rest

export const autofillCompany = async (req, res) => {
  try {
    const { company_name } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: 'company_name is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // gemini-1.5-flash is free and fast

    const prompt = `For the company "${company_name}", return a JSON object:
{
  "description": "2-3 sentence company overview",
  "role": "typical fresher job role",
  "ctc_min": <number in LPA>,
  "ctc_max": <number in LPA>,
  "location": "typical work location",
  "rounds": ["round1", "round2"],
  "bond_years": <number or 0>,
  "eligible_branches": ["CSE", "IT", "ECE"]
}
Return ONLY valid JSON. No explanation, no markdown, no backticks.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const data = JSON.parse(raw);

    res.json({ success: true, autofill: data });
  } catch (err) {
    console.error('autofillCompany error:', err);
    res.status(500).json({ success: false, message: 'AI autofill failed' });
  }
};





// ─── POST /api/companies ──────────────────────────────────────
// admin creates a new company entry
export const createCompany = async (req, res) => {
  try {
    const {
      name, description, ctc_min, ctc_max, role,
      eligible_branches, min_cgpa, max_backlogs,
      status, drive_date, rounds, bond_years, location,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO companies
        (name, description, ctc_min, ctc_max, role, eligible_branches,
         min_cgpa, max_backlogs, status, drive_date, rounds, bond_years,
         location, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        name, description, ctc_min, ctc_max, role,
        eligible_branches, min_cgpa, max_backlogs,
        status || 'upcoming', drive_date, rounds,
        bond_years || 0, location, req.user.id,
      ]
    );

    res.status(201).json({ success: true, company: result.rows[0] });
  } catch (err) {
    console.error('createCompany error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── PUT /api/companies/:id ───────────────────────────────────
// admin updates an existing company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, ctc_min, ctc_max, role,
      eligible_branches, min_cgpa, max_backlogs,
      status, drive_date, rounds, bond_years, location,
    } = req.body;

    const result = await pool.query(
      `UPDATE companies SET
        name=$1, description=$2, ctc_min=$3, ctc_max=$4, role=$5,
        eligible_branches=$6, min_cgpa=$7, max_backlogs=$8,
        status=$9, drive_date=$10, rounds=$11, bond_years=$12, location=$13
       WHERE id=$14
       RETURNING *`,
      [
        name, description, ctc_min, ctc_max, role,
        eligible_branches, min_cgpa, max_backlogs,
        status, drive_date, rounds, bond_years, location, id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({ success: true, company: result.rows[0] });
  } catch (err) {
    console.error('updateCompany error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE /api/companies/:id ────────────────────────────────
// admin deletes a company record
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM companies WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    console.error('deleteCompany error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};