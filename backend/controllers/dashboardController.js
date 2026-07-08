const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Interview = require("../models/Interview");

// @route GET /api/dashboard
// Returns the logged-in user's progress summary + recent activity
const getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const recentInterviews = await Interview.find({ user: user._id, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(5)
    .select("role seniority interviewType overallFeedback.score completedAt");

  // Score trend over the last 10 completed interviews (oldest -> newest) for charting
  const trendDocs = await Interview.find({ user: user._id, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(10)
    .select("overallFeedback.score completedAt role");

  const scoreTrend = trendDocs.reverse().map((i) => ({
    date: i.completedAt,
    score: i.overallFeedback?.score ?? 0,
    role: i.role,
  }));

  // Category breakdown: average score per question category across all completed interviews
  const categoryAgg = await Interview.aggregate([
    { $match: { user: user._id, status: "completed" } },
    { $unwind: "$questions" },
    { $match: { "questions.feedback.score": { $ne: null } } },
    {
      $group: {
        _id: "$questions.category",
        avgScore: { $avg: "$questions.feedback.score" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    stats: user.stats,
    resumeUploaded: !!user.resume?.fileName,
    recentInterviews,
    scoreTrend,
    categoryBreakdown: categoryAgg.map((c) => ({
      category: c._id,
      averageScore: Number(c.avgScore.toFixed(2)),
      count: c.count,
    })),
  });
});

// @route GET /api/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({ isActive: true, "stats.totalInterviews": { $gt: 0 } })
    .sort({ "stats.xp": -1 })
    .limit(50)
    .select("name stats.xp stats.averageScore stats.totalInterviews stats.bestScore stats.streak");

  const leaderboard = topUsers.map((u, idx) => ({
    rank: idx + 1,
    userId: u._id,
    name: u.name,
    xp: u.stats.xp,
    averageScore: u.stats.averageScore,
    totalInterviews: u.stats.totalInterviews,
    bestScore: u.stats.bestScore,
    streak: u.stats.streak,
  }));

  const myRank = leaderboard.find((entry) => String(entry.userId) === String(req.user._id)) || null;

  res.json({ leaderboard, myRank });
});

module.exports = { getDashboard, getLeaderboard };
