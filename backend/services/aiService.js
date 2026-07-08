/**
 * aiService.js
 * A thin, provider-agnostic wrapper around the LLM used for:
 *  1) Generating interview questions (optionally tailored to a resume)
 *  2) Grading a candidate's answer and returning structured feedback
 *  3) Producing an end-of-interview summary
 *
 * Swap providers by setting AI_PROVIDER=openai|gemini in .env.
 * Both providers are called with a JSON-only instruction, so the rest of the
 * app can treat this module as a normal async function that returns objects.
 */

const OpenAI = require("openai");

const PROVIDER = process.env.AI_PROVIDER || "openai";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Calls the configured LLM with a system + user prompt and expects raw JSON back.
 */
async function callModelJSON(systemPrompt, userPrompt) {
  if (PROVIDER === "gemini") {
    return callGemini(systemPrompt, userPrompt);
  }
  return callOpenAI(systemPrompt, userPrompt);
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!openaiClient) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }
  const completion = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

/**
 * Generates a batch of interview questions.
 */
async function generateQuestions({ role, seniority, interviewType, resumeText, count = 5 }) {
  const systemPrompt = `You are an expert technical interviewer and career coach. You generate realistic, high-quality interview questions. Always respond with ONLY valid JSON, no markdown fences, matching this shape:
{"questions": [{"text": string, "category": "behavioral"|"technical"|"system-design"|"resume-based", "difficulty": "easy"|"medium"|"hard"}]}`;

  const userPrompt = `Generate ${count} interview questions for a candidate interviewing for the role of "${role}" at "${seniority}" seniority level. Interview focus: ${interviewType}.
${resumeText ? `Tailor some questions to this candidate's resume (reference specific projects/skills where relevant):\n---\n${resumeText.slice(0, 4000)}\n---` : "No resume was provided, so use realistic general questions for this role."}
Ensure variety in category and difficulty appropriate for the seniority level.`;

  const result = await callModelJSON(systemPrompt, userPrompt);
  return result.questions || [];
}

/**
 * Grades a single answer and returns structured feedback.
 */
async function gradeAnswer({ role, question, answerText }) {
  const systemPrompt = `You are a strict but constructive interview coach grading one interview answer. Always respond with ONLY valid JSON, no markdown fences, matching this shape:
{"score": number (0-10), "strengths": string[], "improvements": string[], "idealAnswerNotes": string}`;

  const userPrompt = `Role: ${role}
Question: ${question}
Candidate's answer: ${answerText || "(no answer provided)"}

Grade the answer on correctness, structure (e.g. STAR for behavioral), clarity, and depth. Give 2-4 concise strengths, 2-4 concise improvements, and a short note on what an ideal answer would include.`;

  return callModelJSON(systemPrompt, userPrompt);
}

/**
 * Produces an overall summary for a completed interview.
 */
async function summarizeInterview({ role, seniority, questions }) {
  const systemPrompt = `You are an interview coach writing a final performance summary. Always respond with ONLY valid JSON, no markdown fences, matching this shape:
{"score": number (0-10), "summary": string, "strengths": string[], "improvements": string[], "recommendedResources": string[]}`;

  const qaSummary = questions
    .map(
      (q, i) =>
        `Q${i + 1} (${q.category}, ${q.difficulty}): ${q.text}\nAnswer: ${q.answerText || "(skipped)"}\nPer-question score: ${q.feedback?.score ?? "n/a"}`
    )
    .join("\n\n");

  const userPrompt = `Role: ${role}, Seniority: ${seniority}
Here is the full transcript of a mock interview:
${qaSummary}

Write an overall performance summary: an aggregate score (0-10), a 3-5 sentence summary of performance, top strengths, top improvement areas, and 2-4 recommended learning resources or topics to study (general topic names, not URLs).`;

  return callModelJSON(systemPrompt, userPrompt);
}

module.exports = { generateQuestions, gradeAnswer, summarizeInterview };
