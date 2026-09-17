import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) {
        res.status(401);
        throw new Error("Not authorized, admin not found");
      }
      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

const protectUser = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, account not found");
      }
      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

// Non-blocking: guest checkout stays the default. Only attaches
// req.user when a *valid* customer token is present.
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer")) {
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    } catch (error) {
      // invalid/expired token — continue as guest
    }
  }
  next();
});

export { protect, protectUser, attachUserIfPresent };