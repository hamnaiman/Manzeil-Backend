import mongoose from "mongoose";
const schema = new mongoose.Schema({
  key: { type: String, default: "storefront", unique: true },
  storyTitle: { type: String, maxlength: 140, default: "Some memories begin with a scent." },
  storyText: { type: String, maxlength: 3000, default: "A familiar place. A favourite person. A moment you wish would last. Fragrance is a beautiful way to carry a little of what you love, wherever you go." },
  contactTitle: { type: String, maxlength: 140, default: "We would love to hear from you." },
  contactIntro: { type: String, maxlength: 1000, default: "Have a question about a fragrance or your order? Send us a message." },
  email: { type: String, maxlength: 254, default: "" },
  phone: { type: String, maxlength: 60, default: "" },
  address: { type: String, maxlength: 500, default: "" },
  hours: { type: String, maxlength: 200, default: "" },
}, { timestamps: true });
export default mongoose.model("SiteContent", schema);
