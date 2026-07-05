// profileRoutes.js — defines all /api/profile endpoints

import express from 'express';                        // express router
import authMiddleware from '../middleware/authMiddleware.js'; // protect routes
import upload from '../middleware/upload.js';          // multer cloudinary middleware
import {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
} from '../controllers/profileController.js';         // import all controllers

const router = express.Router();                      // create router instance

// GET /api/profile — fetch logged in user profile
router.get('/', authMiddleware, getProfile);

// PUT /api/profile — update personal + academic info + skills
router.put('/', authMiddleware, updateProfile);

// PUT /api/profile/password — change password
router.put('/password', authMiddleware, changePassword);

// PUT /api/profile/avatar — upload new profile picture
// upload.single('avatar') — expects a single file with field name 'avatar'
router.put('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);

export default router;                                // export router