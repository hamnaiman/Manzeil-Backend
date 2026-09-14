import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import Admin from "../models/Admin.js";

/**
 * @desc    Login admin & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const admin = await Admin.findOne({ email }).select("+password");

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

/**
 * @desc    Get logged-in admin profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getAdminProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.admin });
});

export { loginAdmin, getAdminProfile };
