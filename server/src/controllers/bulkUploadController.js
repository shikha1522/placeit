// Import database pool
import pool from '../config/db.js';

// Import csv-parser for parsing uploaded CSV
import csv from 'csv-parser';

// Import stream for converting buffer to readable stream
import { Readable } from 'stream';

// Bulk upload questions from CSV file (admin only)
export const bulkUploadQuestions = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    // Array to hold parsed questions
    const questions = [];

    // Array to hold validation errors
    const errors = [];

    // Valid difficulty values
    const validDifficulties = ['easy', 'medium', 'hard'];

    // Convert file buffer to readable stream and parse CSV
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on('data', (row) => {
          // Validate each row
          if (!row.title) {
            errors.push(`Missing title in row: ${JSON.stringify(row)}`);
            return;
          }
          if (!validDifficulties.includes(row.difficulty?.toLowerCase())) {
            errors.push(`Invalid difficulty "${row.difficulty}" for: ${row.title}`);
            return;
          }
          if (!row.topic) {
            errors.push(`Missing topic for: ${row.title}`);
            return;
          }
          if (!row.leetcode_url) {
            errors.push(`Missing leetcode_url for: ${row.title}`);
            return;
          }

          // Push valid row to questions array
          questions.push({
            title: row.title.trim(),
            description: row.description?.trim() || null,
            difficulty: row.difficulty.toLowerCase().trim(),
            topic: row.topic.toLowerCase().trim(),
            leetcode_url: row.leetcode_url.trim()
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // If no valid questions found
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in CSV',
        errors
      });
    }

    // Insert valid questions into database
    let inserted = 0;
    let skipped = 0;

    for (const q of questions) {
      const result = await pool.query(
        `INSERT INTO questions (title, description, difficulty, topic, leetcode_url, added_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [q.title, q.description, q.difficulty, q.topic, q.leetcode_url, req.user.id]
      );

      // Count inserted vs skipped duplicates
      if (result.rows.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    // Send back summary
    res.json({
      success: true,
      message: `Upload complete`,
      inserted,
      skipped,
      errors
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};