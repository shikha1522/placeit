// Import required modules
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from 'dotenv';
env.config();

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL client setup
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Main seed function
const seedQuestions = async () => {
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Read questions JSON file
    const filePath = path.join(__dirname, 'questions.json');
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Found ${questions.length} questions to seed`);

    // Loop through each question and insert
    for (const q of questions) {
      await client.query(
        `INSERT INTO questions (title, description, difficulty, topic, leetcode_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q.title, q.description, q.difficulty, q.topic, q.leetcode_url]
      );
    }

    console.log('All questions seeded successfully');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    // Always close connection
    await client.end();
  }
};

// Run the seed function
seedQuestions();