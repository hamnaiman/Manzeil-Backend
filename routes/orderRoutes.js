import express from "express";
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect , attachUserIfPresent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createOrder); // public checkout (COD)
router.get("/", protect, getOrders); // admin: list all orders
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, updateOrderStatus);
router.post("/", attachUserIfPresent, createOrder); 

export default router;
