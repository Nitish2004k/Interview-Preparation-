import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-ink-800 text-white" : "text-slate-400 hover:text-white hover:bg-ink-800/60"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-white">
            P
          </div>
          <span className="font-display text-lg font-semibold text-white">Prepwise</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/interview/new" className={linkClass}>New Interview</NavLink>
          <NavLink to="/history" className={linkClass}>History</NavLink>
          <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
          <NavLink to="/resume" className={linkClass}>Resume</NavLink>
          {user.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 sm:inline">{user.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn-ghost !px-3 !py-1.5 text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-800 px-4 py-1.5 md:hidden">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/interview/new" className={linkClass}>New</NavLink>
        <NavLink to="/history" className={linkClass}>History</NavLink>
        <NavLink to="/leaderboard" className={linkClass}>Leaders</NavLink>
        <NavLink to="/resume" className={linkClass}>Resume</NavLink>
        {user.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
      </nav>
    </header>
  );
}
