// dashboardRoutes.js
// Registers the /api/dashboard routes
// All routes are protected — user must be logged in (valid JWT)





// dashboardRoutes.js
import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, getDashboardStats);

export default router;