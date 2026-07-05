import express from "express";
import {
  createContestWithAI,
  getAllContests,
  getContestById,
  getContestQuestions,
  submitContest,
  getContestLeaderboard,
  getMyResult,
} from "../controllers/contestController.js";

// Your actual Phase 3 middleware — protect verifies the JWT and sets
// req.user = { id, role }; adminOnly (runs after protect) blocks non-admins.
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Admin-only — Gemini generates the questions and the contest is published immediately
router.post("/generate", adminOnly, createContestWithAI);

// Any authenticated user
router.get("/", getAllContests);
router.get("/:id", getContestById);
router.get("/:id/questions", getContestQuestions);
router.post("/:id/submit", submitContest);
router.get("/:id/leaderboard", getContestLeaderboard);
router.get("/:id/my-result", getMyResult);

export default router;