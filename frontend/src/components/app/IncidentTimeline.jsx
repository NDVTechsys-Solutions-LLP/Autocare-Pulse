import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "ai_triaged", label: "AI Triaged" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Workshop" },
  { key: "resolved", label: "Resolved" },
];

export default function IncidentTimeline({ incident }) {
  const order = STEPS.map((s) => s.key);
  const currentIdx = order.indexOf(incident.status);
  return (
    <div>
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5" data-testid={`step-${step.key}`}>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-[#00F0FF]" />
                ) : active ? (
                  <Clock className="h-5 w-5 text-white animate-pulse" />
                ) : (
                  <Circle className="h-5 w-5 text-neutral-600" />
                )}
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider ${
                    active ? "text-white font-bold" : done ? "text-[#00F0FF]" : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    i < currentIdx ? "bg-[#00F0FF]/60" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="ac-scroll mt-5 max-h-48 space-y-3 overflow-y-auto border-t border-border pt-4">
        {[...(incident.timeline || [])].reverse().map((t, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <div>
              <p className="text-foreground">{t.note}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{new Date(t.at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
