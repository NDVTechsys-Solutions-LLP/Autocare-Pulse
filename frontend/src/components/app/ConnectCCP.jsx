import React, { useState } from "react";
import { Phone, PhoneOff, Radio, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, dealerCfg } from "@/lib/apiClient";
import { toast } from "sonner";

const AGENT_STATES = ["Available", "On Call", "After Work"];

export default function ConnectCCP({ status, onCall }) {
  const [agentState, setAgentState] = useState("Available");
  const [dialing, setDialing] = useState(false);
  const calls = status?.calls || [];

  const placeCall = async () => {
    setDialing(true);
    setAgentState("On Call");
    try {
      const res = await api.post("/dealer/connect/call", { direction: "outbound", customer_name: "Next in queue", transcript: "Agent: Hello, this is AutoCare service. Customer: Hi, calling about my vehicle issue." }, dealerCfg());
      toast.success(`Connected · ${res.data.id}`);
      onCall?.();
    } catch {
      toast.error("Call failed");
    } finally {
      setDialing(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-accent" />
          <h3 className="font-heading text-xl font-semibold">Amazon Connect CCP</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${status?.mode === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
          {status?.mode === "live" ? "Live" : "Simulation"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {AGENT_STATES.map((s) => (
          <button key={s} data-testid={`agent-state-${s.toLowerCase().replace(/ /g, "-")}`} onClick={() => setAgentState(s)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${agentState === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>
            <Circle className="h-2 w-2 fill-current" /> {s}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button data-testid="connect-place-call" onClick={placeCall} disabled={dialing} className="flex-1 rounded-full bg-emerald-600 font-bold hover:bg-emerald-500">
          <Phone className="mr-2 h-4 w-4" /> {dialing ? "Dialing…" : "Place Call"}
        </Button>
        <Button variant="outline" onClick={() => setAgentState("After Work")} className="rounded-full border-border">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      <div className="ac-scroll mt-4 max-h-40 space-y-2 overflow-y-auto">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Recent Calls</p>
        {calls.length === 0 && <p className="text-sm text-muted-foreground">No calls yet.</p>}
        {calls.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-secondary/30 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent">{c.id}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(c.started_at).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{c.transcript}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
