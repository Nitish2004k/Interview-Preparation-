const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Interview = require("../models/Interview");

// @route GET /api/admin/overview
const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalInterviews, completedInterviews, avgScoreAgg] = await Promise.all([
    User.countDocuments(),
    Interview.countDocuments(),
    Interview.countDocuments({ status: "completed" }),
    Interview.aggregate([
      { $match: { status: "completed", "overallFeedback.score": { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$overallFeedback.score" } } },
    ]),
  ]);

  const signupsByDay = await User.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  res.json({
    totalUsers,
    totalInterviews,
    completedInterviews,
    platformAverageScore: avgScoreAgg[0] ? Number(avgScoreAgg[0].avg.toFixed(2)) : 0,
    signupsByDay: signupsByDay.map((d) => ({ date: d._id, count: d.count })),
  });
});

// @route GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const filter = search
    ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
    : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select("-resume.rawText");

  const total = await User.countDocuments(filter);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route PATCH /api/admin/users/:id
// Allows an admin to change role or activate/deactivate a user
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (role) user.role = role;
  if (typeof isActive === "boolean") user.isActive = isActive;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await user.deleteOne();
  await Interview.deleteMany({ user: user._id });
  res.json({ message: "User and their interview history deleted" });
});

// @route GET /api/admin/interviews
const listAllInterviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const interviews = await Interview.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("user", "name email");

  const total = await Interview.countDocuments();
  res.json({ interviews, total, page: Number(page), pages: Math.ceil(total / limit) });
});

module.exports = { getOverview, listUsers, updateUser, deleteUser, listAllInterviews };
