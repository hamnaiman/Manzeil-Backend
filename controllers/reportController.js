import asyncHandler from "../utils/asyncHandler.js";
import Order from "../models/Order.js";

/**
 * Builds a MongoDB aggregation pipeline that buckets orders by a given
 * date granularity and computes revenue/order-count per bucket.
 *
 * period: "weekly" | "monthly" | "yearly"
 */
const buildReportPipeline = (period, startDate) => {
  let groupId;

  if (period === "weekly") {
    // ISO week + year, so buckets don't collide across years
    groupId = {
      year: { $isoWeekYear: "$createdAt" },
      week: { $isoWeek: "$createdAt" },
    };
  } else if (period === "monthly") {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
  } else {
    groupId = { year: { $year: "$createdAt" } };
  }

  return [
    {
      $match: {
        createdAt: { $gte: startDate },
        orderStatus: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: groupId,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
        totalItemsSold: { $sum: { $sum: "$orderItems.quantity" } },
        avgOrderValue: { $avg: "$totalPrice" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
  ];
};

/**
 * @desc    Sales report bucketed weekly, monthly, or yearly
 * @route   GET /api/reports/sales?period=weekly|monthly|yearly&range=<number of days back, optional>
 * @access  Private/Admin
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const { period = "monthly", range } = req.query;

  if (!["weekly", "monthly", "yearly"].includes(period)) {
    res.status(400);
    throw new Error("period must be weekly, monthly, or yearly");
  }

  // Default lookback windows if `range` (days) isn't provided
  const defaultDays = { weekly: 90, monthly: 365, yearly: 365 * 5 };
  const daysBack = range ? Number(range) : defaultDays[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const pipeline = buildReportPipeline(period, startDate);
  const results = await Order.aggregate(pipeline);

  res.json({ success: true, period, data: results });
});

/**
 * @desc    Dashboard summary cards: totals + today/this-week/this-month snapshot
 * @route   GET /api/reports/summary
 * @access  Private/Admin
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const matchNotCancelled = { orderStatus: { $ne: "cancelled" } };

  const [allTime, todayStats, monthStats, yearStats, statusBreakdown, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: matchNotCancelled },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, totalOrders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...matchNotCancelled, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...matchNotCancelled, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...matchNotCancelled, createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: matchNotCancelled },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          unitsSold: { $sum: "$orderItems.quantity" },
          revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      allTime: allTime[0] || { totalRevenue: 0, totalOrders: 0 },
      today: todayStats[0] || { revenue: 0, orders: 0 },
      thisMonth: monthStats[0] || { revenue: 0, orders: 0 },
      thisYear: yearStats[0] || { revenue: 0, orders: 0 },
      statusBreakdown,
      topProducts,
    },
  });
});

export { getSalesReport, getDashboardSummary };
