import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'; // import the routes
import './config/db.js';

// loads all variables from .env into process.env
// must be called before anything else — order matters here
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// process.env.PORT reads the PORT=5000 from your .env file
// if .env is missing for some reason, fallback to 5000

// ─── Middleware ───────────────────────────────────────────────
// middleware = functions that run on EVERY request before it hits your routes

// cors: allows React (localhost:5173) to call this API (localhost:5000)
// without this the browser blocks all requests from frontend to backend
app.use(cors({
  origin: 'http://localhost:5173', // only allow our React frontend
  credentials: true,               // allow JWT token to be sent in headers
}));

// express.json: parses incoming request body as JSON
// without this req.body is always undefined
// example: when React sends { email, password }, this makes req.body work
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
// this means all routes in authRoutes.js are prefixed with /api/auth
// so router.post('/register') becomes POST /api/auth/register

// ─── Routes ──────────────────────────────────────────────────
// we will import and add more routes here as we build each feature
// for now just a health check to confirm server is alive

app.get('/', (req, res) => {
  // req = the incoming request from browser/React
  // res = the response we send back
  res.json({
    message: '🚀 placeIT API is running',
    version: '1.0.0',
  });
});

// ─── Start Server ─────────────────────────────────────────────
// app.listen tells Express to start listening for requests on PORT
app.listen(PORT, () => {
  // this callback runs once when server successfully starts
  console.log(`✅ Server running on http://localhost:${PORT}`);
});