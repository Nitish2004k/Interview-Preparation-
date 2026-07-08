const asyncHandler = require("express-async-handler");
const Interview = require("../models/Interview");
const User = require("../models/User");
const { generateQuestions, gradeAnswer, summarizeInterview } = require("../services/aiService");

// @route POST /api/interviews
// Starts a new interview: generates questions (optionally resume-tailored) and creates the session
const startInterview = asyncHandler(async (req, res) => {
  const { role, seniority = "mid", interviewType = "mixed", mode = "text", questionCount = 5 } = req.body;

  if (!role) {
    res.status(400);
    throw new Error("A target role is required, e.g. 'Frontend Engineer'");
  }

  const user = await User.findById(req.user._id);
  const resumeText = interviewType === "resume-based" ? user.resume?.rawText : null;

  const generated = await generateQuestions({
    role,
    seniority,
    interviewType,
    resumeText,
    count: Math.min(Math.max(Number(questionCount) || 5, 1), 10),
  });

  if (!generated.length) {
    res.status(502);
    throw new Error("The AI provider did not return any questions. Check your AI provider configuration.");
  }

  const interview = await Interview.create({
    user: user._id,
    role,
    seniority,
    interviewType,
    mode,
    questions: generated.map((q) => ({
      text: q.text,
      category: q.category || "general",
      difficulty: q.difficulty || "medium",
    })),
  });

  res.status(201).json({ interview });
});

// @route GET /api/interviews/:id
const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }
  res.json({ interview });
});

// @route GET /api/interviews
const listInterviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const interviews = await Interview.find(filter)
    .sort({ createdAt: -1 })
    .select("role seniority interviewType mode status overallFeedback.score startedAt completedAt createdAt");

  res.json({ interviews });
});

// @route POST /api/interviews/:id/answer
// Submits an answer to a specific question and returns AI feedback for that question
const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answerText, answeredViaVoice = false } = req.body;

  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }
  if (interview.status === "completed") {
    res.status(400);
    throw new Error("This interview is already completed");
  }

  const question = interview.questions.id(questionId);
  if (!question) {
    res.status(404);
    throw new Error("Question not found in this interview");
  }

  const feedback = await gradeAnswer({ role: interview.role, question: question.text, answerText });

  question.answerText = answerText || "";
  question.answeredViaVoice = !!answeredViaVoice;
  question.answeredAt = new Date();
  question.feedback = {
    score: feedback.score,
    strengths: feedback.strengths || [],
    improvements: feedback.improvements || [],
    idealAnswerNotes: feedback.idealAnswerNotes || "",
  };

  await interview.save();

  res.json({ question });
});

// @route POST /api/interviews/:id/complete
// Finalizes the interview, generates overall feedback, and updates user stats/leaderboard
const completeInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }
  if (interview.status === "completed") {
    return res.json({ interview });
  }

  const summary = await summarizeInterview({
    role: interview.role,
    seniority: interview.seniority,
    questions: interview.questions,
  });

  interview.overallFeedback = {
    score: summary.score,
    summary: summary.summary,
    strengths: summary.strengths || [],
    improvements: summary.improvements || [],
    recommendedResources: summary.recommendedResources || [],
  };
  interview.status = "completed";
  interview.completedAt = new Date();
  interview.durationSeconds = Math.round((interview.completedAt - interview.startedAt) / 1000);

  await interview.save();

  // Update denormalized user stats used by dashboard + leaderboard
  const user = await User.findById(req.user._id);
  const answeredCount = interview.questions.filter((q) => q.answeredAt).length;
  const prevTotal = user.stats.totalInterviews;
  const prevAvg = user.stats.averageScore;
  const newScore = summary.score || 0;

  user.stats.totalInterviews = prevTotal + 1;
  user.stats.totalQuestionsAnswered += answeredCount;
  user.stats.averageScore = Number((((prevAvg * prevTotal) + newScore) / (prevTotal + 1)).toFixed(2));
  user.stats.bestScore = Math.max(user.stats.bestScore, newScore);
  user.stats.xp += Math.round(newScore * 10 + answeredCount * 5);

  const now = new Date();
  const last = user.stats.lastInterviewAt;
  if (last && now - last < 1000 * 60 * 60 * 24 * 2) {
    user.stats.streak += 1;
  } else {
    user.stats.streak = 1;
  }
  user.stats.lastInterviewAt = now;

  await user.save();

  res.json({ interview, updatedStats: user.stats });
});

// @route DELETE /api/interviews/:id
const abandonInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }
  interview.status = "abandoned";
  await interview.save();
  res.json({ message: "Interview marked as abandoned" });
});

module.exports = {
  startInterview,
  getInterview,
  listInterviews,
  submitAnswer,
  completeInterview,
  abandonInterview,
};
