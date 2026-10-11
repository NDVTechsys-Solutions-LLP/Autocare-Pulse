import React, { useEffect, useState } from "react";
import { Activity, PhoneCall, PhoneOff, Timer } from "lucide-react";
import { api, dealerCfg } from "@/lib/apiClient";

function fmtTime(s) {
  s = Math.round(s || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

export default function ConnectMetricsPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get("/dealer/connect/metrics", dealerCfg());
        if (alive) setData(r.data);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!data) return null;
  const c = data.current || {};
  const h = data.historical || {};
  const cards = [
    { icon: Activity, label: "Contacts in Queue", value: c.CONTACTS_IN_QUEUE ?? 0 },
    { icon: PhoneCall, label: "Handled (1h)", value: h.CONTACTS_HANDLED ?? 0 },
    { icon: PhoneOff, label: "Abandoned (1h)", value: h.CONTACTS_ABANDONED ?? 0 },
    { icon: Timer, label: "Avg Handle Time", value: fmtTime(h.HANDLE_TIME) },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all duration-300">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-[#00F0FF]" />
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">
            Amazon Connect — Live Contact Metrics
          </h3>
        </div>
        <span
          data-testid="connect-metrics-mode"
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${
            data.mode === "live"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
          }`}
        >
          {data.mode === "live" ? "Live · AWS" : "Simulation"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((x) => (
          <div
            key={x.label}
            data-testid={`connect-kpi-${x.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
            className="rounded-xl border border-white/[0.06] bg-[#141720] p-4"
          >
            <x.icon className="h-4 w-4 text-[#00F0FF]" />
            <p className="mt-2 font-heading text-2xl font-black text-white">{x.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mt-1">{x.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
