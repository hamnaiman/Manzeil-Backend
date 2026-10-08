import express from "express";
import SiteContent from "../models/SiteContent.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { textField, emailField } from "../utils/contentValidation.js";
const router = express.Router();
router.get("/", asyncHandler(async (req, res) => {
  const content = await SiteContent.findOne({ key: "storefront" });
  res.json({ success: true, data: content || new SiteContent() });
}));
router.put("/", protect, asyncHandler(async (req, res) => {
  const fields = {};
  const limits = { storyTitle: 140, storyText: 3000, contactTitle: 140, contactIntro: 1000, phone: 60, address: 500, hours: 200 };
  for (const [key, max] of Object.entries(limits)) {
    if (req.body[key] !== undefined) fields[key] = textField(req.body[key], key, max, ["storyTitle", "storyText", "contactTitle"].includes(key));
  }
  if (req.body.email !== undefined) fields.email = emailField(req.body.email);
  const content = await SiteContent.findOneAndUpdate({ key: "storefront" }, { $set: fields }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, data: content });
}));
export default router;
