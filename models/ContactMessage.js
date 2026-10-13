import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, maxlength: 254 },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  kind: { type: String, enum: ["message", "feedback"], default: "message" },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ["new", "read", "resolved"], default: "new" },
}, { timestamps: true });
schema.index({ createdAt: -1 });
export default mongoose.model("ContactMessage", schema);
