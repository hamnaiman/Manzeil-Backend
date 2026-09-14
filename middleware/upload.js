import multer from "multer";
import { storage } from "../config/cloudinary.js";

// Accepts up to 5 images per product upload, stored directly on Cloudinary
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

export default upload;
