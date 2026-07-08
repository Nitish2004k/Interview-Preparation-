import React, { useEffect, useState } from "react";
import api from "../api/axios";

function OverviewCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    api.get("/admin/overview").then(({ data }) => setOverview(data));
  }, []);

  useEffect(() => {
    if (tab === "users") {
      api.get("/admin/users", { params: { search } }).then(({ data }) => setUsers(data.users));
    }
    if (tab === "interviews") {
      api.get("/admin/interviews").then(({ data }) => setInterviews(data.interviews));
    }
  }, [tab, search]);

  const toggleActive = async (u) => {
    const { data } = await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
    setUsers((prev) => prev.map((x) => (x._id === u._id ? data.user : x)));
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    const { data } = await api.patch(`/admin/users/${u._id}`, { role: newRole });
    setUsers((prev) => prev.map((x) => (x._id === u._id ? data.user : x)));
  };

  const removeUser = async (u) => {
    if (!confirm(`Delete ${u.name}? This also deletes their interview history.`)) return;
    await api.delete(`/admin/users/${u._id}`);
    setUsers((prev) => prev.filter((x) => x._id !== u._id));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin panel</p>
        <h1 className="text-2xl font-bold">Platform overview</h1>
      </div>

      <div className="flex gap-2">
        {["overview", "users", "interviews"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? "bg-accent text-white" : "bg-ink-800 text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <OverviewCard label="Total users" value={overview.totalUsers} />
          <OverviewCard label="Total interviews" value={overview.totalInterviews} />
          <OverviewCard label="Completed interviews" value={overview.completedInterviews} />
          <OverviewCard label="Platform avg score" value={`${overview.platformAverageScore}/10`} />
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <input
            className="input max-w-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-700 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Interviews</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`pill ${u.role === "admin" ? "bg-accent/10 text-accent-light" : "bg-ink-800 text-slate-400"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.stats?.totalInterviews ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`pill ${u.isActive ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"}`}>
                        {u.isActive ? "active" : "deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleRole(u)} className="btn-ghost !py-1 !px-2 text-xs">
                          {u.role === "admin" ? "Revoke admin" : "Make admin"}
                        </button>
                        <button onClick={() => toggleActive(u)} className="btn-ghost !py-1 !px-2 text-xs">
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => removeUser(u)} className="btn-ghost !py-1 !px-2 text-xs text-coral">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No users found.</p>}
          </div>
        </div>
      )}

      {tab === "interviews" && (
        <div className="card divide-y divide-ink-700">
          {interviews.map((iv) => (
            <div key={iv._id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-white">{iv.role} <span className="text-slate-500">· {iv.user?.name}</span></p>
                <p className="text-xs text-slate-500">
                  {iv.status} · {new Date(iv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="pill bg-ink-800 text-slate-400">{iv.overallFeedback?.score ?? "–"}/10</span>
            </div>
          ))}
          {interviews.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No interviews yet.</p>}
        </div>
      )}
    </div>
  );
}
