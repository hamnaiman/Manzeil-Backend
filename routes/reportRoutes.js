import express from "express";
import { getSalesReport, getDashboardSummary } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);
router.get("/sales", protect, getSalesReport);

export default router;
