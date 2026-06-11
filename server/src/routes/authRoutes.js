// authRoutes.js
// A route file maps a URL path to a controller function
// Think of it like: "when this URL is hit, run this function"

import express from 'express';
import { register, login } from '../controllers/authController.js';
// importing the two functions we just wrote

const router = express.Router();
// Router is a mini express app — we attach routes to it, then plug it into main app

// POST /api/auth/register → runs the register function
router.post('/register', register);

// POST /api/auth/login → runs the login function
router.post('/login', login);

export default router;