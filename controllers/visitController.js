import asyncHandler from "../utils/asyncHandler.js";
import Visit from "../models/Visit.js";

const recordVisit = asyncHandler(async (req, res) => {
  const { path } = req.body;
  await Visit.create({ path: path || "/" });
  res.status(201).json({ success: true });
});

const getVisitStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last14Days = new Date(startOfToday);
  last14Days.setDate(last14Days.getDate() - 13);

  const [total, today, thisWeek, thisMonth, dailyBreakdown] = await Promise.all([
    Visit.countDocuments({}),
    Visit.countDocuments({ createdAt: { $gte: startOfToday } }),
    Visit.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Visit.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Visit.aggregate([
      { $match: { createdAt: { $gte: last14Days } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
  ]);

  res.json({ success: true, data: { total, today, thisWeek, thisMonth, dailyBreakdown } });
});

export { recordVisit, getVisitStats };