import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ScorePill from "../components/ScorePill";

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400">Loading your dashboard…</p>;

  const stats = data?.stats || {};
  const trend = (data?.scoreTrend || []).map((t) => ({
    date: new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: t.score,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="text-3xl font-bold">{user?.name?.split(" ")[0]}'s Progress</h1>
        </div>
        <Link to="/interview/new" className="btn-primary">Start a new interview</Link>
      </div>

      {!data?.resumeUploaded && (
        <div className="card flex items-center justify-between gap-4 border-amber/30 bg-amber/5 p-4">
          <p className="text-sm text-amber">
            You haven't uploaded a resume yet. Upload one to unlock resume-tailored interview questions.
          </p>
          <Link to="/resume" className="btn-secondary whitespace-nowrap !py-1.5 !px-3 text-xs">Upload resume</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Interviews completed" value={stats.totalInterviews ?? 0} />
        <StatCard label="Average score" value={`${stats.averageScore ?? 0}/10`} accent="text-accent-light" />
        <StatCard label="Best score" value={`${stats.bestScore ?? 0}/10`} accent="text-mint" />
        <StatCard label="XP" value={stats.xp ?? 0} accent="text-amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h3 className="mb-4 font-semibold text-white">Score trend</h3>
          {trend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid stroke="#212A3F" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#5B6B8C" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#5B6B8C" fontSize={12} />
                <Tooltip contentStyle={{ background: "#161D2E", border: "1px solid #212A3F", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#8B7CF6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Complete an interview to see your trend.</p>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-white">Score by category</h3>
          {data?.categoryBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#212A3F" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} stroke="#5B6B8C" fontSize={12} />
                <YAxis type="category" dataKey="category" stroke="#5B6B8C" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: "#161D2E", border: "1px solid #212A3F", borderRadius: 8 }} />
                <Bar dataKey="averageScore" fill="#2DD4BF" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No category data yet.</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Recent interviews</h3>
          <Link to="/history" className="text-sm font-medium text-accent-light hover:underline">View all</Link>
        </div>
        {data?.recentInterviews?.length ? (
          <div className="divide-y divide-ink-700">
            {data.recentInterviews.map((iv) => (
              <Link
                key={iv._id}
                to={`/interview/${iv._id}/result`}
                className="flex items-center justify-between gap-4 py-3 transition hover:opacity-80"
              >
                <div>
                  <p className="font-medium text-white">{iv.role}</p>
                  <p className="text-xs text-slate-500">
                    {iv.seniority} · {iv.interviewType} · {new Date(iv.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <ScorePill score={iv.overallFeedback?.score} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No completed interviews yet — start your first one!</p>
        )}
      </div>
    </div>
  );
}
