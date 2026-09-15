import React from "react";
import { Ticket, AlertTriangle, Timer, Gauge } from "lucide-react";

export default function KpiBar({ kpis }) {
  const cards = [
    { icon: Ticket, label: "Open Tickets", value: kpis.open, sub: `${kpis.total} total`, glow: "border-accent/40" },
    { icon: AlertTriangle, label: "SLA Breaches", value: kpis.breaches, sub: `${kpis.sla_compliance}% compliant`, glow: "border-red-500/40 shadow-[0_0_20px_rgba(255,42,75,0.15)]" },
    { icon: Timer, label: "Avg Resolution", value: `${kpis.avg_resolution_hours}h`, sub: `${kpis.resolved} resolved`, glow: "border-amber-500/40" },
    { icon: Gauge, label: "Dealer CSAT", value: `${kpis.csat}%`, sub: `${kpis.escalations_active} escalations`, glow: "border-emerald-500/40" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} data-testid={`kpi-${c.label.toLowerCase().replace(/ /g, "-")}`} className={`rounded-xl border bg-card p-4 ${c.glow}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-heading text-3xl font-extrabold">{c.value}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
