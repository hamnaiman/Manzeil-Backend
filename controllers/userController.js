import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/User.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, token: generateToken(user._id) },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }
  const user = await User.findOne({ email }).select("+password");
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, token: generateToken(user._id) },
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export { registerUser, loginUser, getUserProfile };