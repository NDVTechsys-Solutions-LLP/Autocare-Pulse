import React from "react";

const STATUS_MAP = {
  submitted: { label: "Submitted", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  ai_triaged: { label: "AI Triaged", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  assigned: { label: "Assigned", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  in_progress: { label: "In Workshop", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

const PRIORITY_MAP = {
  High: "bg-red-500/15 text-red-400 border-red-500/40",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const StatusBadge = ({ status, testid }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.submitted;
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold font-mono uppercase tracking-wider ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
};

export const PriorityBadge = ({ priority, testid }) => (
  <span data-testid={testid} className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono uppercase tracking-wider ${PRIORITY_MAP[priority] || PRIORITY_MAP.Medium}`}>
    {priority}
  </span>
);
