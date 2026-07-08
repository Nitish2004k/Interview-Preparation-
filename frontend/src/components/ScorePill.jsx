import React from "react";

// Score color coding: this is the platform's visual signature — every score,
// everywhere in the app, uses this same coral -> amber -> mint scale.
export function scoreColor(score) {
  if (score === null || score === undefined) return { text: "text-slate-400", bg: "bg-slate-500/10", ring: "ring-slate-500/30" };
  if (score >= 8) return { text: "text-mint", bg: "bg-mint/10", ring: "ring-mint/30" };
  if (score >= 6) return { text: "text-amber", bg: "bg-amber/10", ring: "ring-amber/30" };
  return { text: "text-coral", bg: "bg-coral/10", ring: "ring-coral/30" };
}

export default function ScorePill({ score, size = "md" }) {
  const c = scoreColor(score);
  const sizeClass = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";

  return (
    <div
      className={`grid ${sizeClass} shrink-0 place-items-center rounded-full font-display font-bold ring-2 ${c.bg} ${c.text} ${c.ring}`}
      title={score === null || score === undefined ? "Not scored yet" : `Score: ${score}/10`}
    >
      {score === null || score === undefined ? "–" : score}
    </div>
  );
}
