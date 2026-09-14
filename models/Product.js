import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // needed to delete from Cloudinary later
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "House Brand",
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["male", "female", "unisex"],
        message: "Category must be male, female, or unisex",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      default: 0,
    },
    sizeMl: {
      type: Number, // e.g. 50, 100 ml
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one product image is required",
      },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true, // allows soft-hiding a product without deleting it
    },
  },
  { timestamps: true }
);

// Speeds up category-filtered listing queries on the storefront
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
