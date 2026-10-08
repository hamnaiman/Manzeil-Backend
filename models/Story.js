import mongoose from "mongoose";
const asset = new mongoose.Schema({
  url: { type: String, default: "" },
  publicId: { type: String, default: "" },
}, { _id: false });
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  note: { type: String, trim: true, maxlength: 240, default: "" },
  tone: { type: String, enum: ["rose", "noir", "amber", "lavender"], default: "rose" },
  order: { type: Number, min: 0, max: 999, default: 0 },
  published: { type: Boolean, default: false },
  video: { type: asset, default: () => ({}) },
  poster: { type: asset, default: () => ({}) },
}, { timestamps: true });
export default mongoose.model("Story", schema);
