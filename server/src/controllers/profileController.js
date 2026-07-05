// profileController.js — all profile related API logic

import pool from '../config/db.js';      // postgresql connection pool
import bcrypt from 'bcrypt';             // for hashing new passwords
import cloudinary from '../config/cloudinary.js'; // for deleting old avatars

// ─── GET /api/profile ─────────────────────────────────────────
// fetches complete profile of logged in user
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;          // injected by authMiddleware

    // fetch user data (exclude password for security)
    const userResult = await pool.query(
      `SELECT 
        id, name, email, branch, cgpa, backlogs,
        graduation_year, phone, linkedin_url, github_url,
        avatar_url, profile_complete, created_at, role
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    // if user not found return 404
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // fetch skills from resumes table (skills live here per schema)
    const resumeResult = await pool.query(
      `SELECT skills FROM resumes WHERE user_id = $1`,
      [userId]
    );

    const user = userResult.rows[0];                    // get user object
    user.skills = resumeResult.rows[0]?.skills || [];   // attach skills array

    res.json({ user });                                 // send combined profile

  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── PUT /api/profile ─────────────────────────────────────────
// updates personal + academic info
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;          // get logged in user id

    // destructure all editable fields from request body
    const {
      name,
      branch,
      cgpa,
      backlogs,
      graduation_year,
      phone,
      linkedin_url,
      github_url,
      skills,                            // array of skill strings
    } = req.body;

    // update users table with new values
    // COALESCE keeps old value if new value is null/undefined
    const updatedUser = await pool.query(
      `UPDATE users SET
        name            = COALESCE($1, name),
        branch          = COALESCE($2, branch),
        cgpa            = COALESCE($3, cgpa),
        backlogs        = COALESCE($4, backlogs),
        graduation_year = COALESCE($5, graduation_year),
        phone           = COALESCE($6, phone),
        linkedin_url    = COALESCE($7, linkedin_url),
        github_url      = COALESCE($8, github_url),
        profile_complete = (
          name IS NOT NULL AND
          branch IS NOT NULL AND
          cgpa IS NOT NULL AND
          phone IS NOT NULL AND
          linkedin_url IS NOT NULL
        )
       WHERE id = $9
       RETURNING id, name, email, branch, cgpa, backlogs,
                 graduation_year, phone, linkedin_url, github_url,
                 avatar_url, profile_complete, role`,
      [name, branch, cgpa, backlogs, graduation_year, phone, linkedin_url, github_url, userId]
    );

    // if skills array provided, upsert into resumes table
    if (skills !== undefined) {
      await pool.query(
        `INSERT INTO resumes (user_id, skills, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET skills = $2, updated_at = NOW()`,
        [userId, skills]                 // upsert skills array
      );
    }

    const user = updatedUser.rows[0];              // get updated user
    user.skills = skills || [];                    // attach skills to response

    res.json({ message: 'Profile updated successfully', user });

  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── PUT /api/profile/password ────────────────────────────────
// changes user password after verifying current password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;          // get logged in user id

    const { currentPassword, newPassword } = req.body;

    // validate both fields present
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    // validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // fetch current hashed password from db
    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];         // get user row

    // compare entered current password with stored hash
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    // if wrong current password, reject
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // hash the new password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password in db
    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── PUT /api/profile/avatar ──────────────────────────────────
// uploads new avatar to cloudinary and saves url in db
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;          // get logged in user id

    // multer + cloudinary already uploaded file, req.file has the result
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // req.file.path is the cloudinary URL of uploaded image
    const avatarUrl = req.file.path;

    // fetch old avatar url to delete from cloudinary
    const oldResult = await pool.query(
      `SELECT avatar_url FROM users WHERE id = $1`,
      [userId]
    );

    const oldAvatarUrl = oldResult.rows[0]?.avatar_url;  // old avatar url

    // if old avatar exists, delete it from cloudinary to save space
    if (oldAvatarUrl) {
      // extract public_id from cloudinary url
      // url format: https://res.cloudinary.com/cloud/image/upload/v123/placeit/avatars/abc123.jpg
      const parts = oldAvatarUrl.split('/');              // split by /
      const filename = parts[parts.length - 1];           // get last part
      const publicId = `placeit/avatars/${filename.split('.')[0]}`; // remove extension
      
      await cloudinary.uploader.destroy(publicId);        // delete old image
    }

    // save new avatar url in users table
    const updated = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2
       RETURNING id, name, email, avatar_url`,
      [avatarUrl, userId]
    );

    res.json({
      message: 'Avatar updated successfully',
      user: updated.rows[0],            // return updated user
    });

  } catch (err) {
    console.error('updateAvatar error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};