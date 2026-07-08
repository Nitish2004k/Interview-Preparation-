const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { extractResumeText, extractSkills } = require("../utils/resumeParser");

// @route POST /api/resume/upload
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const rawText = await extractResumeText(req.file.path);
  const parsedSkills = extractSkills(rawText);

  const user = await User.findById(req.user._id);
  user.resume = {
    fileName: req.file.originalname,
    filePath: req.file.path,
    rawText,
    parsedSkills,
    uploadedAt: new Date(),
  };
  await user.save();

  res.status(201).json({
    message: "Resume uploaded and parsed successfully",
    resume: {
      fileName: user.resume.fileName,
      parsedSkills: user.resume.parsedSkills,
      uploadedAt: user.resume.uploadedAt,
      hasExtractedText: rawText.length > 0,
    },
  });
});

// @route GET /api/resume
const getResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.resume?.fileName) {
    return res.json({ resume: null });
  }
  res.json({
    resume: {
      fileName: user.resume.fileName,
      parsedSkills: user.resume.parsedSkills,
      uploadedAt: user.resume.uploadedAt,
    },
  });
});

// @route DELETE /api/resume
const deleteResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.resume = undefined;
  await user.save();
  res.json({ message: "Resume removed" });
});

module.exports = { uploadResume, getResume, deleteResume };
