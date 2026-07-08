const express = require("express");
const { getDashboard, getLeaderboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", protect, getDashboard);
router.get("/leaderboard", protect, getLeaderboard);

module.exports = router;
