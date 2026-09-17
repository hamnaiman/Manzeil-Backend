import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  { path: { type: String, default: "/" } },
  { timestamps: true }
);
visitSchema.index({ createdAt: 1 });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;