import express from 'express';
import {
  getAllExperiences,
  getMyExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience,
  upvoteExperience,
} from '../controllers/experiencesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET  /api/experiences         → feed of all shared experiences (protected)
router.get('/', protect, getAllExperiences);

// GET  /api/experiences/mine    → logged-in user's own posted experiences
router.get('/mine', protect, getMyExperiences);

// GET  /api/experiences/:id     → single experience detail
router.get('/:id', protect, getExperienceById);

// POST /api/experiences         → share a new experience
router.post('/', protect, createExperience);

// PUT  /api/experiences/:id     → edit own experience
router.put('/:id', protect, updateExperience);

// DELETE /api/experiences/:id   → delete own experience
router.delete('/:id', protect, deleteExperience);

// POST /api/experiences/:id/upvote → upvote an experience
router.post('/:id/upvote', protect, upvoteExperience);

export default router;