import pg from 'pg';
import dotenv from 'dotenv';

// load environment variables from .env
dotenv.config();

// pg.Pool manages multiple database connections
// instead of opening a new connection for every request
// it keeps a pool of connections ready and reuses them
// much faster than creating a new connection each time
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // DATABASE_URL comes from .env file:
  // postgresql://placement_user:placement123@localhost:5432/placeit
});

// test the connection when server starts
// this runs once to confirm DB is reachable
pool.connect((err, client, release) => {
  if (err) {
    // if connection fails — show exact error so we can fix it
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    // release the test connection back to pool
    // so it's available for actual requests
    release();
  }
});

// export pool so any controller can use it to run queries
// usage in other files: import pool from '../config/db.js'
//                       pool.query('SELECT * FROM users')
export default pool;