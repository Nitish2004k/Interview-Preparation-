# Prepwise — AI Interview Preparation Platform

A full-stack MERN app for practicing job interviews with AI-generated questions,
AI-graded feedback, resume-tailored questions, voice interviews, a progress
dashboard, interview history, a leaderboard, and an admin panel.

## Stack

- **Frontend:** React 18 + Vite, React Router, Tailwind CSS, Recharts
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT auth
- **AI:** OpenAI (default) or Google Gemini — swappable via `.env`
- **Voice:** Browser-native Web Speech API (SpeechRecognition + SpeechSynthesis) — no paid voice API needed
- **File upload:** Multer (resumes), with PDF text extraction via `pdf-parse`

## Features implemented

| Feature | Where |
|---|---|
| JWT auth (register/login/me) | `backend/controllers/authController.js`, `backend/middleware/auth.js` |
| Resume upload + parsing | `backend/controllers/resumeController.js`, `backend/utils/resumeParser.js` |
| AI-generated interview questions | `backend/services/aiService.js` → `generateQuestions` |
| AI feedback per answer + overall report | `aiService.js` → `gradeAnswer`, `summarizeInterview` |
| Voice interview (STT + TTS in-browser) | `frontend/src/pages/InterviewSession.jsx` |
| Progress dashboard (charts, stats) | `frontend/src/pages/Dashboard.jsx`, `backend/controllers/dashboardController.js` |
| Admin panel (users, interviews, platform stats) | `frontend/src/pages/Admin.jsx`, `backend/controllers/adminController.js` |
| Leaderboard (XP-based ranking) | `frontend/src/pages/Leaderboard.jsx` |
| Interview history | `frontend/src/pages/InterviewHistory.jsx` |

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
- An OpenAI API key (or a Gemini API key)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your Mongo URI, JWT secret, and AI API key
npm run dev             # starts on http://localhost:5000
```

To create your first admin account, either set `role: "admin"` directly in MongoDB
for a registered user, or run:

```bash
npm run seed:admin      # uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # defaults to http://localhost:5000/api, adjust if needed
npm run dev              # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, and you're in.

### 3. Switching AI providers

In `backend/.env`:
```
AI_PROVIDER=openai        # or "gemini"
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
```
`backend/services/aiService.js` is the only file that talks to the AI provider —
swap in a different model/provider there if needed.

## Project structure

```
backend/
  config/db.js              MongoDB connection
  models/                   User, Interview (with embedded questions/feedback)
  middleware/                auth (JWT), admin (role check), upload (multer), errorHandler
  controllers/                auth, resume, interview, dashboard, admin
  routes/                     REST endpoints for each controller
  services/aiService.js      All AI calls (question gen, grading, summary)
  utils/                      token generation, resume text/skill extraction, admin seed script
  server.js                   Express app entry point

frontend/
  src/
    api/axios.js              Axios instance with JWT interceptor
    context/AuthContext.jsx   Auth state (login/register/logout, current user)
    components/               Navbar, ProtectedRoute, ScorePill
    pages/                     Login, Register, Dashboard, ResumeUpload, NewInterview,
                                InterviewSession, InterviewResult, InterviewHistory,
                                Leaderboard, Admin
```

## API overview

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/resume/upload         (multipart, field name "resume")
GET    /api/resume
DELETE /api/resume

POST   /api/interviews            { role, seniority, interviewType, mode, questionCount }
GET    /api/interviews
GET    /api/interviews/:id
POST   /api/interviews/:id/answer { questionId, answerText, answeredViaVoice }
POST   /api/interviews/:id/complete
DELETE /api/interviews/:id

GET    /api/dashboard
GET    /api/leaderboard

GET    /api/admin/overview
GET    /api/admin/users
PATCH  /api/admin/users/:id       { role?, isActive? }
DELETE /api/admin/users/:id
GET    /api/admin/interviews
```

All routes except `/auth/register` and `/auth/login` require
`Authorization: Bearer <token>`. Admin routes additionally require `role: "admin"`.

## Notes & next steps

- Resume parsing extracts text from PDF/TXT natively; wire in a `.docx` parser
  (e.g. `mammoth`) if you need DOCX text extraction too.
- Voice mode works in Chrome/Edge out of the box; Safari/Firefox support for
  `SpeechRecognition` is limited — the UI falls back to typed answers automatically.
- Rate limiting is applied globally (300 req/15min per IP) — tune per-route if
  you want stricter limits specifically on the AI-backed endpoints.
- For production: move file storage to S3/Cloud Storage instead of local disk,
  add refresh tokens, and set `NODE_ENV=production` with a real `CLIENT_URL`.
