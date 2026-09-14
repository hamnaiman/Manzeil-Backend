import express from "express";
import {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductImage,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public storefront routes
router.get("/", getProducts);

// Admin routes (order matters: /admin before /:id)
router.get("/admin", protect, getAdminProducts);
router.post("/", protect, upload.array("images", 5), createProduct);

router.get("/:id", getProductById);
router.put("/:id", protect, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, deleteProduct);
router.delete("/:id/images/:publicId", protect, deleteProductImage);

export default router;
