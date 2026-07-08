const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    category: { type: String, default: "general" }, // behavioral, technical, system-design, resume-based
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    answerText: { type: String, default: "" },
    answeredViaVoice: { type: Boolean, default: false },
    feedback: {
      score: { type: Number, min: 0, max: 10, default: null }, // per-question score
      strengths: [String],
      improvements: [String],
      idealAnswerNotes: String,
    },
    answeredAt: Date,
  },
  { _id: true }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true }, // e.g. "Frontend Engineer"
    seniority: { type: String, enum: ["intern", "junior", "mid", "senior", "staff"], default: "mid" },
    interviewType: {
      type: String,
      enum: ["behavioral", "technical", "system-design", "mixed", "resume-based"],
      default: "mixed",
    },
    mode: { type: String, enum: ["text", "voice"], default: "text" },
    status: { type: String, enum: ["in-progress", "completed", "abandoned"], default: "in-progress" },

    questions: [questionSchema],

    overallFeedback: {
      score: { type: Number, min: 0, max: 10, default: null },
      summary: String,
      strengths: [String],
      improvements: [String],
      recommendedResources: [String],
    },

    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationSeconds: Number,
  },
  { timestamps: true }
);

interviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Interview", interviewSchema);
