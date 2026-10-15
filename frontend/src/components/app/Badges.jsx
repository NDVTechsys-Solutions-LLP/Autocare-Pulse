import React from "react";

const STATUS_MAP = {
  submitted: { label: "Submitted", cls: "bg-white/[0.04] text-neutral-400 border-white/10" },
  ai_triaged: { label: "AI Triaged", cls: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30" },
  assigned: { label: "Assigned", cls: "bg-white/[0.08] text-white border-white/20" },
  in_progress: { label: "In Workshop", cls: "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/35" },
  resolved: { label: "Resolved", cls: "bg-white/10 text-white border-white/25" },
};

const PRIORITY_MAP = {
  High: "bg-[#e60012]/15 text-[#e60012] border-[#e60012]/40",
  Medium: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30",
  Low: "bg-white/[0.04] text-neutral-400 border-white/10",
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
