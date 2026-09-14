/**
 * One-time script to create the first admin account.
 * Run with: npm run seed:admin
 * Edit the values below (or set via env) before running.
 */
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@perfumestore.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const name = process.env.SEED_ADMIN_NAME || "Store Admin";

  const exists = await Admin.findOne({ email });
  if (exists) {
    console.log("Admin already exists with this email:", email);
    process.exit(0);
  }

  const admin = await Admin.create({ name, email, password, role: "superadmin" });
  console.log("Admin created successfully:");
  console.log({ email: admin.email, password: "(as provided, now hashed in DB)" });
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
