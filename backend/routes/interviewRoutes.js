const express = require("express");
const {
  startInterview,
  getInterview,
  listInterviews,
  submitAnswer,
  completeInterview,
  abandonInterview,
} = require("../controllers/interviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.post("/", startInterview);
router.get("/", listInterviews);
router.get("/:id", getInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeInterview);
router.delete("/:id", abandonInterview);

module.exports = router;
