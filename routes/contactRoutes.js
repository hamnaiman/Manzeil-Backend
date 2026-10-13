import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { fail, textField, emailField, pageNumber } from "../utils/contentValidation.js";
import { feedbackFields } from '../utils/contactFeedback.js';
const router = express.Router();
// Bounded, per-process limit for the public contact form.
const attempts = new Map();
router.post("/", (req, res, next) => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 10 * 60 * 1000 };
  if (entry.count >= 5 || (!attempts.has(key) && attempts.size >= 10000)) return res.status(429).json({ success: false, message: "Please wait a few minutes before sending another message." });
  entry.count++;
  attempts.set(key, entry);
  next();
}, asyncHandler(async (req, res) => {
  const fields = {
    ...feedbackFields(req.body),
    name: textField(req.body.name, "Name", 100, true),
    email: emailField(req.body.email, true),
    subject: textField(req.body.subject, "Subject", 150, true),
    message: textField(req.body.message, "Message", 4000, true),
  };
  await ContactMessage.create(fields);
  res.status(201).json({ success: true, message: "Thank you. Your message has been received." });
}));
router.use(protect);
router.get("/", asyncHandler(async (req, res) => {
  const page = pageNumber(req.query.page);
  const limit = 20;
  const filter = ["new", "read", "resolved"].includes(req.query.status) ? { status: req.query.status } : {};
  if (req.query.kind === 'feedback') filter.kind = 'feedback';
  else if (req.query.kind === 'message') filter.kind = { $ne: 'feedback' };
  const [data, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit) } });
}));
router.patch("/:id", asyncHandler(async (req, res) => {
  if (!["new", "read", "resolved"].includes(req.body.status)) fail("Invalid message status");
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!message) fail("Message not found", 404);
  res.json({ success: true, data: message });
}));
export default router;
