import express from 'express';
// import all controller functions we'll write next
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  autofillCompany,
} from '../controllers/companiesController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET  /api/companies        → all students can see list (protected)
router.get('/',     protect, getAllCompanies);

// GET  /api/companies/:id    → single company detail (protected)
router.get('/:id',  protect, getCompanyById);

// POST /api/companies/autofill → AI prefill from company name (admin only)
router.post('/autofill', protect, adminOnly, autofillCompany);

// POST /api/companies        → add new company (admin only)
router.post('/',    protect, adminOnly, createCompany);

// PUT  /api/companies/:id    → edit company (admin only)
router.put('/:id',  protect, adminOnly, updateCompany);

// DELETE /api/companies/:id  → remove company (admin only)
router.delete('/:id', protect, adminOnly, deleteCompany);

export default router;