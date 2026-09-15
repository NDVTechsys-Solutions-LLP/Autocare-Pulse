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
    <div className="rounded-xl border border-border bg-card p-5" data-testid="callbacks-panel">
      <div className="mb-3 flex items-center gap-2">
        <PhoneOutgoing className="h-5 w-5 text-accent" />
        <h3 className="font-heading text-xl font-semibold">Callback Requests</h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{items.filter((c) => c.status === "pending").length} pending</span>
      </div>
      <div className="ac-scroll max-h-72 space-y-2 overflow-y-auto">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No callback requests yet.</p>}
        {items.map((c) => (
          <div key={c.id} data-testid={`callback-${c.id}`} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
            <div>
              <p className="text-sm"><span className="font-mono text-accent">{c.phone}</span> · {c.customer_name}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.incident_id} · {new Date(c.created_at).toLocaleTimeString()}</p>
            </div>
            {c.status === "pending" ? (
              <Button data-testid={`callback-place-${c.id}`} onClick={() => place(c.id)} size="sm" className="rounded-full bg-emerald-600 font-bold hover:bg-emerald-500">Place Call</Button>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-400">{c.status}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
