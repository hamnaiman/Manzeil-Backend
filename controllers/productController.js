import asyncHandler from "../utils/asyncHandler.js";
import Product from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

/**
 * @desc    Create a new product (with uploaded images)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, description, category, price, discountPrice, sizeMl, stock, isFeatured } = req.body;

  if (!name || !description || !category || !price) {
    res.status(400);
    throw new Error("Name, description, category and price are required");
  }

  // req.files is populated by multer + CloudinaryStorage (see upload middleware)
  const images = (req.files || []).map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  if (images.length === 0) {
    res.status(400);
    throw new Error("At least one product image is required");
  }

  const product = await Product.create({
    name,
    brand,
    description,
    category,
    price,
    discountPrice: discountPrice || 0,
    sizeMl,
    stock: stock || 0,
    isFeatured: isFeatured === "true" || isFeatured === true,
    images,
  });

  res.status(201).json({ success: true, data: product });
});

/**
 * @desc    Get all products (public storefront) with filters, search & pagination
 * @route   GET /api/products
 * @access  Public
 * Query params: category, search, minPrice, maxPrice, page, limit, sort
 */
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, page = 1, limit = 12, sort } = req.query;

  const filter = { isActive: true };

  if (category && ["male", "female", "unisex"].includes(category)) {
    filter.category = category;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    newest: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 50);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
});

/**
 * @desc    Get all products for admin panel (includes inactive)
 * @route   GET /api/products/admin
 * @access  Private/Admin
 */
const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

/**
 * @desc    Get a single product by id
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ success: true, data: product });
});

/**
 * @desc    Update a product (text fields + optionally append new images)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const fields = ["name", "brand", "description", "category", "price", "discountPrice", "sizeMl", "stock", "isFeatured", "isActive"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Append newly uploaded images, if any
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    product.images.push(...newImages);
  }

  const updated = await product.save();
  res.json({ success: true, data: updated });
});

/**
 * @desc    Delete a product (and its Cloudinary images)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Clean up images on Cloudinary so storage doesn't accumulate orphans
  await Promise.all(
    product.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch(() => null)
    )
  );

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});

/**
 * @desc    Remove a single image from a product
 * @route   DELETE /api/products/:id/images/:publicId
 * @access  Private/Admin
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  await cloudinary.uploader.destroy(publicId).catch(() => null);

  res.json({ success: true, data: product });
});

export {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductImage,
};
