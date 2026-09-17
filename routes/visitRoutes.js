import express from "express";
import { recordVisit, getVisitStats } from "../controllers/visitController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", recordVisit);
router.get("/stats", protect, getVisitStats);

export default router;