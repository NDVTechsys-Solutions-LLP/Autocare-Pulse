import React, { useEffect, useState } from "react";
import { PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, dealerCfg } from "@/lib/apiClient";
import { toast } from "sonner";

export default function CallbacksPanel() {
  const [items, setItems] = useState([]);

  const load = async () => {
    try { const r = await api.get("/dealer/callbacks", dealerCfg()); setItems(r.data); } catch { /* ignore */ }
  };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const place = async (id) => {
    try { const r = await api.post(`/dealer/callbacks/${id}/place`, {}, dealerCfg()); toast.success(`Callback placed${r.data.contact_id ? ` · ${r.data.contact_id}` : ""}`); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed to place callback"); }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all duration-300" data-testid="callbacks-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PhoneOutgoing className="h-5 w-5 text-[#00F0FF]" />
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Callback Requests</h3>
        </div>
        <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-white/[0.06] text-neutral-300 border border-white/10">
          {items.filter((c) => c.status === "pending").length} pending
        </span>
      </div>
      <div className="ac-scroll max-h-72 space-y-2.5 overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-neutral-500 font-mono">No callback requests registered yet.</p>}
        {items.map((c) => (
          <div key={c.id} data-testid={`callback-${c.id}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#141720] p-3.5">
            <div>
              <p className="text-sm">
                <span className="font-mono text-xs font-semibold text-[#00F0FF]">{c.phone}</span> · <span className="text-white font-medium">{c.customer_name}</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">
                {c.incident_id} · {new Date(c.created_at).toLocaleTimeString()}
              </p>
            </div>
            {c.status === "pending" ? (
              <Button
                data-testid={`callback-place-${c.id}`}
                onClick={() => place(c.id)}
                size="sm"
                className="rounded-full bg-white hover:bg-neutral-200 font-heading text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-white/10"
              >
                Place Call
              </Button>
            ) : (
              <span className="rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-2.5 py-0.5 font-mono text-[10px] uppercase text-[#00F0FF]">
                {c.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
