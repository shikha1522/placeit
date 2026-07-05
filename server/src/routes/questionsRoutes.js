import express from 'express';
import multer from 'multer';

import {
  getQuestions,
  getQuestionById,
  solveQuestion,
  getQuestionStats
} from '../controllers/questionsController.js';

import { bulkUploadQuestions } from '../controllers/bulkUploadController.js';
import { protect } from '../middleware/authMiddleware.js';

// Create router
const router = express.Router();

// Multer setup — store file in memory buffer, not disk
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/questions - get all questions with search and filters (protected)
router.get('/', protect, getQuestions);

// GET /api/questions/stats - get user solving stats (protected)
router.get('/stats', protect, getQuestionStats);

// GET /api/questions/:id - get single question (protected)
router.get('/:id', protect, getQuestionById);

// PUT /api/questions/:id/solve - toggle solved + save notes (protected)
router.put('/:id/solve', protect, solveQuestion);

// POST /api/questions/bulk-upload — admin only CSV upload
router.post('/bulk-upload', protect, upload.single('file'), bulkUploadQuestions);

export default router;