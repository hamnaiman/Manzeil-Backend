import asyncHandler from "../utils/asyncHandler.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * @desc    Place a new order (Cash on Delivery)
 * @route   POST /api/orders
 * @access  Public
 */
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items provided");
  }
  if (!shippingAddress) {
    res.status(400);
    throw new Error("Shipping address is required");
  }

  // Re-fetch products from DB to trust price/stock, never trust client-sent prices
  const productIds = orderItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  let itemsPrice = 0;
  const verifiedItems = orderItems.map((item) => {
    const dbProduct = products.find((p) => p._id.toString() === item.product);

    if (!dbProduct) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (dbProduct.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${dbProduct.name}`);
    }

    const price = dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
    itemsPrice += price * item.quantity;

    return {
      product: dbProduct._id,
      name: dbProduct.name,
      price,
      quantity: item.quantity,
      image: dbProduct.images?.[0]?.url,
    };
  });

  // No shipping fee for now — COD-only, testing phase. Set a real value
  // here (or make it admin-configurable) once shipping policy is decided.
  const shippingPrice = 0;
  const totalPrice = itemsPrice + shippingPrice;

  const order = await Order.create({
    user: req.user?._id || null,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod: paymentMethod || "COD",
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  // Decrement stock for each purchased product
  await Promise.all(
    verifiedItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
    )
  );

  res.status(201).json({ success: true, data: order });
});

/**
 * @desc    Get a single order by id
 * @route   GET /api/orders/:id
 * @access  Private/Admin
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("orderItems.product", "name images");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json({ success: true, data: order });
});

/**
 * @desc    Get all orders (admin panel) with filters & pagination
 * @route   GET /api/orders
 * @access  Private/Admin
 * Query params: status, page, limit, from, to
 */
const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, from, to } = req.query;

  const filter = {};
  if (status) filter.orderStatus = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
});

/**
 * @desc    Update order status (e.g. pending -> processing -> shipped -> delivered)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "delivered") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "COD") {
      order.isPaid = true; // cash collected on delivery
      order.paidAt = new Date();
    }
  }

  const updated = await order.save();
  res.json({ success: true, data: updated });
});

export { createOrder, getOrderById, getOrders, updateOrderStatus };
