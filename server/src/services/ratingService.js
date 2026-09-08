import pool from '../config/db.js';

const DSA_POINTS = { Easy: 5, Medium: 10, Hard: 20 };

const getBadge = (score) => {
  if (score >= 1000) return 'Platinum';
  if (score >= 500) return 'Gold';
  if (score >= 200) return 'Silver';
  return 'Bronze';
};

// Core: apply a delta to a user's rating, log to rating_history, return result
const applyRatingChange = async (userId, delta, reason, { isDsaSolve = false, isDsaUnsolve = false, isContest = false } = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let ratingRes = await client.query(`SELECT * FROM ratings WHERE user_id = $1`, [userId]);

    let before;
    if (ratingRes.rows.length === 0) {
      before = 0;
      await client.query(
        `INSERT INTO ratings (user_id, score, badge, questions_solved, contests_participated, updated_at)
         VALUES ($1, 0, $2, 0, 0, NOW())`,
        [userId, getBadge(0)]
      );
    } else {
      before = ratingRes.rows[0].score;
    }

    const after = Math.max(0, before + delta); // rating never goes negative
    const badge = getBadge(after);

    await client.query(
      `UPDATE ratings
       SET score = $1,
           badge = $2,
           questions_solved = questions_solved + $3,
           contests_participated = contests_participated + $4,
           updated_at = NOW()
       WHERE user_id = $5`,
      [
        after,
        badge,
        isDsaSolve ? 1 : isDsaUnsolve ? -1 : 0,
        isContest ? 1 : 0,
        userId,
      ]
    );

    await client.query(
      `INSERT INTO rating_history (user_id, rating_before, rating_after, delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, before, after, after - before, reason]
    );

    await client.query('COMMIT');
    return { before, after, delta: after - before, badge };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Called from questionsController.js on solve/unsolve
export const recordDsaSolve = async (userId, difficulty, solved) => {
  const points = DSA_POINTS[difficulty] || 0;
  if (points === 0) return null;
  const delta = solved ? points : -points;
  const reason = solved ? 'dsa_solved' : 'dsa_unsolved';
  return applyRatingChange(userId, delta, reason, {
    isDsaSolve: solved,
    isDsaUnsolve: !solved,
  });
};

// Called from contestController.js on submission scoring
// scoreOutOf30: user's raw contest score, contestAverage: avg score among submitters so far (null if <3 submissions)
export const recordContestResult = async (userId, scoreOutOf30, contestAverage) => {
  const basePoints = Math.round((scoreOutOf30 / 30) * 30);
  let bonus = 0;
  if (contestAverage !== null && contestAverage !== undefined) {
    bonus = Math.round(scoreOutOf30 - contestAverage);
  }
  const delta = basePoints + bonus;
  return applyRatingChange(userId, delta, 'contest_submission', { isContest: true });
};

export const getBadgeForScore = getBadge;