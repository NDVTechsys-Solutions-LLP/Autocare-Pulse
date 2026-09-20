import React, { useEffect, useState } from "react";
import { Truck, MapPin, Clock } from "lucide-react";
import { api } from "@/lib/apiClient";

export default function RsaTracker({ incidentId }) {
  const [d, setD] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const r = await api.get(`/incidents/${incidentId}/rsa`); if (alive) setD(r.data); } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [incidentId]);

  if (!d) return null;
  const pct = Math.round((d.progress || 0) * 100);
  const arrived = d.status === "arrived";

  return (
    <div data-testid="rsa-tracker" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-emerald-400">
          <Truck className="h-4 w-4" />{d.unit} · {arrived ? "Arrived" : "En route"}
        </p>
        <span data-testid="rsa-eta" className="flex items-center gap-1 font-mono text-xs text-emerald-400">
          <Clock className="h-3 w-3" />{arrived ? "Arrived" : `${d.remaining_min} min`}
        </span>
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-emerald-950/40">
        <div className="absolute left-0 top-0 h-2 rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
        <Truck className="absolute -top-2 h-5 w-5 text-emerald-300 transition-all duration-700" style={{ left: `calc(${pct}% - 10px)` }} />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.current.lat.toFixed(4)}, {d.current.lng.toFixed(4)}</span>
        <span>{pct}% to you</span>
      </div>
    </div>
  );
}
