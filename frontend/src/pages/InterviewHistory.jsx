import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ScorePill from "../components/ScorePill";

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/interviews", { params: filter ? { status: filter } : {} })
      .then(({ data }) => setInterviews(data.interviews))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your history</p>
          <h1 className="text-2xl font-bold">Interview History</h1>
        </div>
        <div className="flex gap-2">
          {["", "completed", "in-progress", "abandoned"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === s ? "bg-accent text-white" : "bg-ink-800 text-slate-400 hover:text-white"
              }`}
            >
              {s || "all"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : interviews.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-400">No interviews found.</p>
          <Link to="/interview/new" className="btn-primary mt-4 inline-flex">Start your first interview</Link>
        </div>
      ) : (
        <div className="card divide-y divide-ink-700">
          {interviews.map((iv) => (
            <Link
              key={iv._id}
              to={iv.status === "completed" ? `/interview/${iv._id}/result` : `/interview/${iv._id}`}
              className="flex items-center justify-between gap-4 p-4 transition hover:bg-ink-800/50"
            >
              <div>
                <p className="font-medium text-white">{iv.role}</p>
                <p className="mt-0.5 text-xs text-slate-500 capitalize">
                  {iv.seniority} · {iv.interviewType.replace("-", " ")} · {iv.mode} ·{" "}
                  {new Date(iv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`pill capitalize ${
                    iv.status === "completed"
                      ? "bg-mint/10 text-mint"
                      : iv.status === "abandoned"
                      ? "bg-coral/10 text-coral"
                      : "bg-amber/10 text-amber"
                  }`}
                >
                  {iv.status}
                </span>
                {iv.status === "completed" && <ScorePill score={iv.overallFeedback?.score} size="sm" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
