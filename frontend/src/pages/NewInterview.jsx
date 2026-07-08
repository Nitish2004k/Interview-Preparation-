import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const OPTIONS = {
  seniority: ["intern", "junior", "mid", "senior", "staff"],
  interviewType: ["mixed", "behavioral", "technical", "system-design", "resume-based"],
  mode: [
    { value: "text", label: "Text" },
    { value: "voice", label: "Voice" },
  ],
};

export default function NewInterview() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "",
    seniority: "mid",
    interviewType: "mixed",
    mode: "text",
    questionCount: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/interviews", form);
      navigate(`/interview/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">New session</p>
      <h1 className="text-2xl font-bold">Set up your mock interview</h1>
      <p className="mt-1 text-sm text-slate-400">
        Questions are generated fresh by AI for every session, based on your choices below.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6">
        {error && <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}

        <div>
          <label className="label">Target role</label>
          <input
            required
            className="input"
            placeholder="e.g. Frontend Engineer, Product Manager, Data Analyst"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Seniority</label>
            <select
              className="input"
              value={form.seniority}
              onChange={(e) => setForm({ ...form, seniority: e.target.value })}
            >
              {OPTIONS.seniority.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Question count</label>
            <input
              type="number"
              min={3}
              max={10}
              className="input"
              value={form.questionCount}
              onChange={(e) => setForm({ ...form, questionCount: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Interview focus</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OPTIONS.interviewType.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm({ ...form, interviewType: t })}
                className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${
                  form.interviewType === t
                    ? "border-accent-light bg-accent/10 text-white"
                    : "border-ink-600 text-slate-400 hover:text-white"
                }`}
              >
                {t.replace("-", " ")}
              </button>
            ))}
          </div>
          {form.interviewType === "resume-based" && (
            <p className="mt-2 text-xs text-amber">
              Make sure you've uploaded a resume first — questions will reference it directly.
            </p>
          )}
        </div>

        <div>
          <label className="label">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.mode.map((m) => (
              <button
                type="button"
                key={m.value}
                onClick={() => setForm({ ...form, mode: m.value })}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  form.mode === m.value
                    ? "border-accent-light bg-accent/10 text-white"
                    : "border-ink-600 text-slate-400 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {form.mode === "voice" && (
            <p className="mt-2 text-xs text-slate-500">
              Voice mode uses your browser's built-in speech recognition and text-to-speech — no extra setup needed.
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Generating questions…" : "Start interview"}
        </button>
      </form>
    </div>
  );
}
