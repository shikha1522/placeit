import pool from '../config/db.js';

export const getMyRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`SELECT * FROM ratings WHERE user_id = $1`, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        rating: { score: 0, badge: 'Bronze', questions_solved: 0, contests_participated: 0 },
      });
    }

    res.json({ success: true, rating: result.rows[0] });
  } catch (err) {
    console.error('Get rating error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyRatingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 30 } = req.query;

    const result = await pool.query(
      `SELECT rating_after AS score, delta, reason, created_at
       FROM rating_history
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    console.error('Get rating history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.name, r.score, r.badge, r.questions_solved, r.contests_participated
      FROM ratings r
      JOIN users u ON u.id = r.user_id
      ORDER BY r.score DESC
      LIMIT 50
    `);

    res.json({ success: true, leaderboard: result.rows });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};