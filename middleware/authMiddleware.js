import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/Admin.js";

/**
 * Protects admin routes. Expects a Bearer token in the Authorization
 * header, verifies it, and attaches the admin document to req.admin.
 */
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

export { protect };
