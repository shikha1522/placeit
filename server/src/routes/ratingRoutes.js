import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyRating, getMyRatingHistory, getLeaderboard } from '../controllers/ratingController.js';

const router = express.Router();

router.get('/me', protect, getMyRating);
router.get('/me/history', protect, getMyRatingHistory);
router.get('/leaderboard', protect, getLeaderboard);

export default router;