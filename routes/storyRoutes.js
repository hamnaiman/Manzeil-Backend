import express from "express";
import multer from "multer";
import Story from "../models/Story.js";
import { cloudinary } from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { fail, storyFields } from "../utils/contentValidation.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 2, fields: 8, fieldSize: 4096 },
  fileFilter(req, file, cb) {
    const allowed = file.fieldname === "video" ? ["video/mp4", "video/webm"] :
      file.fieldname === "poster" ? ["image/jpeg", "image/png", "image/webp"] : [];
    if (!allowed.includes(file.mimetype)) return cb(Object.assign(new Error("Use MP4/WebM video or JPG/PNG/WebP cover"), { status: 400 }));
    cb(null, true);
  },
}).fields([{ name: "video", maxCount: 1 }, { name: "poster", maxCount: 1 }]);

function uploadAsset(file, resourceType) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({
      folder: "perfume-store/stories", resource_type: resourceType,
      ...(resourceType === "image" ? { transformation: [{ width: 1200, crop: "limit" }] } : {}),
    }, (error, result) => error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id })).end(file.buffer);
  });
}
async function removeAsset(asset, type) {
  if (!asset?.publicId) return;
  try { await cloudinary.uploader.destroy(asset.publicId, { resource_type: type }); }
  catch { console.warn("Story asset cleanup failed; retry cleanup in Cloudinary."); }
}
router.get("/", asyncHandler(async (req, res) => {
  const items = await Story.find({ published: true }).sort({ order: 1, createdAt: -1 }).select("-__v -video.publicId -poster.publicId");
  res.json({ success: true, data: items });
}));
router.use(protect);
router.get("/admin", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Story.find().sort({ order: 1, createdAt: -1 }) });
}));
async function saveStory(req, res) {
  const fields = storyFields(req.body);
  const story = req.params.id ? await Story.findById(req.params.id) : new Story();
  if (!story) fail("Story not found", 404);
  Object.assign(story, fields);
  await story.validate();
  if (req.files?.poster?.[0]?.size > 5 * 1024 * 1024) fail("Cover image must be 5 MB or smaller");
  const previous = { video: story.video?.toObject(), poster: story.poster?.toObject() };
  const uploaded = {};
  try {
    for (const field of ["video", "poster"]) {
      if (req.files?.[field]?.[0]) {
        uploaded[field] = await uploadAsset(req.files[field][0], field === "video" ? "video" : "image");
        story[field] = uploaded[field];
      }
    }
    await story.save();
  } catch (error) {
    await Promise.all(Object.entries(uploaded).map(([field, asset]) => removeAsset(asset, field === "video" ? "video" : "image")));
    throw error;
  }
  await Promise.all(Object.keys(uploaded).map(field => removeAsset(previous[field], field === "video" ? "video" : "image")));
  res.status(req.params.id ? 200 : 201).json({ success: true, data: story });
}
router.post("/", upload, asyncHandler(saveStory));
router.put("/:id", upload, asyncHandler(saveStory));
router.delete("/:id", asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) fail("Story not found", 404);
  await story.deleteOne();
  await Promise.all([removeAsset(story.video, "video"), removeAsset(story.poster, "image")]);
  res.json({ success: true, message: "Story deleted" });
}));
export default router;
