// dashboardController.js
// Handles all data fetching for the Dashboard page
// Returns stats, DSA progress, upcoming companies, and recent activity

import pool from '../config/db.js';// PostgreSQL connection pool

const getDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const [
      dsaStats,
      dsaTotal,
      companiesStats,
      applicationsStats,
      ratingStats,
      upcomingCompanies,
      recentActivity,
      userInfo,
      notifications,
    ] = await Promise.all([

      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE q.difficulty = 'Easy') AS easy_solved,
          COUNT(*) FILTER (WHERE q.difficulty = 'Medium') AS medium_solved,
          COUNT(*) FILTER (WHERE q.difficulty = 'Hard') AS hard_solved,
          COUNT(*) AS total_solved
        FROM user_questions uq
        JOIN questions q ON q.id = uq.question_id
        WHERE uq.user_id = $1 AND uq.solved = true
      `, [userId]),

      pool.query(`SELECT COUNT(*) AS total FROM questions`),

      pool.query(`SELECT COUNT(*) AS total FROM companies`),

      pool.query(`
        SELECT COUNT(*) AS total 
        FROM applications 
        WHERE user_id = $1
      `, [userId]),

      pool.query(`
        SELECT score AS rating
        FROM ratings
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `, [userId]),

      pool.query(`
        SELECT 
          id,
          name,
          role,
          drive_date,
          (drive_date - CURRENT_DATE) AS days_left
        FROM companies
        WHERE drive_date >= CURRENT_DATE
        ORDER BY drive_date ASC
        LIMIT 5
      `),

      pool.query(`
        SELECT 
          'dsa' AS type,
          CONCAT('Solved ', q.title, ' — ', q.difficulty) AS description,
          uq.solved_at AS created_at
        FROM user_questions uq
        JOIN questions q ON q.id = uq.question_id
        WHERE uq.user_id = $1 AND uq.solved = true

        UNION ALL

        SELECT 
          'application' AS type,
          CONCAT('Applied to ', c.name) AS description,
          a.applied_at AS created_at
        FROM applications a
        JOIN companies c ON c.id = a.company_id
        WHERE a.user_id = $1

        UNION ALL

        SELECT 
          'contest' AS type,
          CONCAT('Completed ', ct.title) AS description,
          cs.submitted_at AS created_at
        FROM contest_submissions cs
        JOIN contests ct ON ct.id = cs.contest_id
        WHERE cs.user_id = $1

        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]),

      pool.query(`
        SELECT name, email, role 
        FROM users 
        WHERE id = $1
      `, [userId]),

      pool.query(`
        SELECT message, type, created_at
        FROM notifications
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
        LIMIT 3
      `, [userId]),
    ]);

    const dsa = dsaStats.rows[0];
    const user = userInfo.rows[0];
    const rating = ratingStats.rows[0]?.rating || 0;

    res.json({
      success: true,
      data: {
        user: {
          name: user?.name || 'Student',
          email: user?.email,
          branch: user?.branch || 'CSE',
          role: user?.role || 'student',
          initials: (user?.name || 'S')[0].toUpperCase(),
        },
        stats: {
          dsaSolved: parseInt(dsa.total_solved) || 0,
          dsaTotal: parseInt(dsaTotal.rows[0].total) || 0,
          companies: parseInt(companiesStats.rows[0].total) || 0,
          applications: parseInt(applicationsStats.rows[0].total) || 0,
          rating: parseInt(rating) || 1200,
        },
        dsaProgress: {
          easy: parseInt(dsa.easy_solved) || 0,
          medium: parseInt(dsa.medium_solved) || 0,
          hard: parseInt(dsa.hard_solved) || 0,
          total: parseInt(dsa.total_solved) || 0,
        },
        upcomingCompanies: upcomingCompanies.rows.map(c => ({
          id: c.id,
          name: c.name,
          roleType: c.role || 'SDE',
          visitDate: c.drive_date,
          daysLeft: parseInt(c.days_left),
        })),
        recentActivity: recentActivity.rows.map(a => ({
          type: a.type,
          description: a.description,
          createdAt: a.created_at,
        })),
        notifications: notifications.rows.map(n => ({
          message: n.message,
          type: n.type,
          createdAt: n.created_at,
        })),
      },
    });

  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { getDashboardStats };