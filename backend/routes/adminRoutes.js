const express = require("express");
const {
  getOverview,
  listUsers,
  updateUser,
  deleteUser,
  listAllInterviews,
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");

const router = express.Router();

router.use(protect, adminOnly);
router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/interviews", listAllInterviews);

module.exports = router;
