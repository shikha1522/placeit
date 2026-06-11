// authController.js
// This file contains the logic for register and login
// A controller is just a function that handles what happens when a route is hit

import bcrypt from 'bcryptjs';       // for hashing passwords
import jwt from 'jsonwebtoken';       // for creating tokens
import pool from '../config/db.js';   // our PostgreSQL connection

// ── REGISTER ──────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    // Step 1: pull out what the frontend sent us
    const { name, email, password } = req.body;

    // Step 2: check all fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
      // 400 = bad request (user's fault)
    }

    // Step 3: check if this email already exists in DB
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]  // $1 is a placeholder — prevents SQL injection attacks
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
      // 409 = conflict (already exists)
    }

    // Step 4: hash the password before saving
    // 10 is the "salt rounds" — how many times it scrambles (higher = safer but slower)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: insert new user into the database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, created_at)
       VALUES ($1, $2, $3, 'student', NOW())
       RETURNING id, name, email, role`,
      // RETURNING gives us back the inserted row so we don't need a second query
      [name, email, hashedPassword]
    );

    const user = result.rows[0]; // the newly created user

    // Step 6: create a JWT token for this user
    const token = jwt.sign(
      { id: user.id, role: user.role },  // payload — what's stored inside the token
      process.env.JWT_SECRET,             // secret key to sign with (from .env)
      { expiresIn: process.env.JWT_EXPIRES_IN } // token expires in 7d
    );

    // Step 7: send back the token and user info
    res.status(201).json({
      // 201 = created successfully
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
    // 500 = something broke on our end
  }
};

// ── LOGIN ──────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    // Step 1: get email and password from request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Step 2: find the user by email in the database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
      // 401 = unauthorized — don't say "email not found" (security risk)
    }

    const user = result.rows[0];

    // Step 3: compare typed password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    // bcrypt.compare returns true/false — it does NOT decrypt, it re-hashes and checks

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Step 4: create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Step 5: send token + user back to frontend
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};