const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

// Extracts raw text from an uploaded resume file (.pdf or .txt supported natively;
// .doc/.docx are stored but not parsed here — swap in a docx-parsing lib if needed).
async function extractResumeText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  // .doc / .docx fallback: no text extracted, AI will just use role/seniority context
  return "";
}

// Very lightweight keyword-based skill extraction as a fallback/enhancement
const SKILL_KEYWORDS = [
  "javascript", "typescript", "react", "node.js", "node", "express", "mongodb",
  "sql", "python", "java", "c++", "aws", "docker", "kubernetes", "graphql",
  "next.js", "redux", "tailwind", "git", "ci/cd", "rest api", "html", "css",
];

function extractSkills(text = "") {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill));
}

module.exports = { extractResumeText, extractSkills };
