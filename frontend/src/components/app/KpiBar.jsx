import React from "react";
import { Ticket, AlertTriangle, Timer, Gauge } from "lucide-react";

export default function KpiBar({ kpis }) {
  const cards = [
    {
      icon: Ticket,
      label: "Open Tickets",
      value: kpis.open,
      sub: `${kpis.total} total logged`,
      color: "text-[#00F0FF]",
      border: "border-white/[0.08] hover:border-[#00F0FF]/40",
      iconBg: "bg-[#00F0FF]/10 text-[#00F0FF]",
    },
    {
      icon: AlertTriangle,
      label: "SLA Breaches",
      value: kpis.breaches,
      sub: `${kpis.sla_compliance}% compliant`,
      color: "text-[#E63946]",
      border: kpis.breaches > 0
        ? "border-[#E63946]/50 shadow-[0_0_20px_rgba(230,57,70,0.15)]"
        : "border-white/[0.08] hover:border-[#E63946]/40",
      iconBg: "bg-[#E63946]/10 text-[#E63946]",
    },
    {
      icon: Timer,
      label: "Avg Resolution",
      value: `${kpis.avg_resolution_hours}h`,
      sub: `${kpis.resolved} resolved tickets`,
      color: "text-neutral-200",
      border: "border-white/[0.08] hover:border-white/20",
      iconBg: "bg-white/[0.06] text-neutral-300",
    },
    {
      icon: Gauge,
      label: "Dealer CSAT",
      value: `${kpis.csat}%`,
      sub: `${kpis.escalations_active} active escalations`,
      color: "text-white",
      border: "border-white/[0.08] hover:border-[#00F0FF]/40",
      iconBg: "bg-[#00F0FF]/10 text-[#00F0FF]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          data-testid={`kpi-${c.label.toLowerCase().replace(/ /g, "-")}`}
          className={`group rounded-2xl bg-[#0e1015] border p-5 transition-all duration-300 ${c.border}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              {c.label}
            </span>
            <div className={`grid h-8 w-8 place-items-center rounded-xl ${c.iconBg}`}>
              <c.icon className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-3 font-heading text-3xl font-black tracking-tight ${c.color}`}>
            {c.value}
          </p>
          <p className="mt-1 font-mono text-[11px] text-neutral-400">
            {c.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

