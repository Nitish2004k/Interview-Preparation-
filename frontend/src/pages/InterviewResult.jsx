import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import ScorePill from "../components/ScorePill";

export default function InterviewResult() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => setInterview(data.interview));
  }, [id]);

  if (!interview) return <p className="text-slate-400">Loading report…</p>;

  const fb = interview.overallFeedback;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Interview report</p>
        <h1 className="text-2xl font-bold">{interview.role}</h1>
        <p className="text-sm text-slate-400 capitalize">
          {interview.seniority} · {interview.interviewType.replace("-", " ")} · {interview.mode} mode
        </p>
      </div>

      {interview.status !== "completed" ? (
        <div className="card p-6">
          <p className="text-slate-400">This interview hasn't been completed yet.</p>
          <Link to={`/interview/${id}`} className="btn-primary mt-4 inline-flex">Resume interview</Link>
        </div>
      ) : (
        <>
          <div className="card flex items-center gap-5 p-6">
            <ScorePill score={fb?.score} size="lg" />
            <div>
              <p className="font-semibold text-white">Overall performance</p>
              <p className="mt-1 text-sm text-slate-300">{fb?.summary}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fb?.strengths?.length > 0 && (
              <div className="card p-5">
                <p className="label text-mint">Strengths</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                  {fb.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {fb?.improvements?.length > 0 && (
              <div className="card p-5">
                <p className="label text-amber">Improvement areas</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                  {fb.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>

          {fb?.recommendedResources?.length > 0 && (
            <div className="card p-5">
              <p className="label">Recommended to study</p>
              <div className="flex flex-wrap gap-2">
                {fb.recommendedResources.map((r, i) => (
                  <span key={i} className="pill bg-accent/10 text-accent-light">{r}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <p className="mb-3 font-semibold text-white">Question-by-question breakdown</p>
            <div className="space-y-4">
              {interview.questions.map((q, i) => (
                <div key={q._id} className="border-b border-ink-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Q{i + 1} · {q.category}</p>
                      <p className="mt-1 font-medium text-white">{q.text}</p>
                    </div>
                    <ScorePill score={q.feedback?.score} size="sm" />
                  </div>
                  {q.answerText && (
                    <p className="mt-2 rounded-lg bg-ink-800 p-3 text-sm text-slate-300">{q.answerText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/interview/new" className="btn-primary">Practice again</Link>
            <Link to="/history" className="btn-secondary">View all history</Link>
          </div>
        </>
      )}
    </div>
  );
}
