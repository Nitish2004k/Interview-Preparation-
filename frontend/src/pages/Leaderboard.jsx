import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/leaderboard").then(({ data }) => setData(data));
  }, []);

  if (!data) return <p className="text-slate-400">Loading leaderboard…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Community ranking</p>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ranked by XP, earned from completing interviews and answering questions well.
        </p>
      </div>

      {data.myRank && (
        <div className="card flex items-center justify-between border-accent/40 bg-accent/5 p-4">
          <p className="text-sm text-white">Your rank: <span className="font-bold text-accent-light">#{data.myRank.rank}</span></p>
          <p className="text-sm text-slate-300">{data.myRank.xp} XP</p>
        </div>
      )}

      <div className="card divide-y divide-ink-700">
        {data.leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center justify-between gap-4 p-4 ${
              user && String(entry.userId) === String(user._id ?? user.id) ? "bg-accent/5" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-display font-bold text-slate-400">
                {medal(entry.rank) || `#${entry.rank}`}
              </span>
              <div>
                <p className="font-medium text-white">{entry.name}</p>
                <p className="text-xs text-slate-500">
                  {entry.totalInterviews} interviews · avg {entry.averageScore}/10 · 🔥 {entry.streak}
                </p>
              </div>
            </div>
            <p className="font-display font-bold text-accent-light">{entry.xp} XP</p>
          </div>
        ))}
        {data.leaderboard.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">No completed interviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
