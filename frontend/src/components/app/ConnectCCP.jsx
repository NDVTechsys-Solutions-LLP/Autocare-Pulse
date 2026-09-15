import React, { useState } from "react";
import { Phone, PhoneOff, Radio, Circle, Users, UserCheck, PhoneIncoming, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, dealerCfg } from "@/lib/apiClient";
import { toast } from "sonner";

const AGENT_STATES = ["Available", "On Call", "After Work"];

export default function ConnectCCP({ status, onCall, incidentId }) {
  const [agentState, setAgentState] = useState("Available");
  const [dialing, setDialing] = useState(false);
  const [dest, setDest] = useState("");
  const calls = status?.calls || [];
  const live = status?.mode === "live";
  const m = status?.metrics || {};

  const metricCards = [
    { icon: Users, label: "Online", value: m.AGENTS_ONLINE ?? 0 },
    { icon: UserCheck, label: "Available", value: m.AGENTS_AVAILABLE ?? 0 },
    { icon: PhoneIncoming, label: "In Queue", value: m.CONTACTS_IN_QUEUE ?? 0 },
    { icon: Timer, label: "Oldest (s)", value: m.OLDEST_CONTACT_AGE ?? 0 },
  ];

  const placeCall = async () => {
    if (live && !/^\+[1-9]\d{7,14}$/.test(dest.trim())) {
      toast.error("Enter destination in E.164 format, e.g. +14155550100");
      return;
    }
    setDialing(true);
    setAgentState("On Call");
    try {
      const res = await api.post("/dealer/connect/call", {
        direction: "outbound",
        customer_name: "Next in queue",
        destination_phone_number: dest.trim(),
        incident_id: incidentId || null,
      }, dealerCfg());
      toast.success(live ? `Outbound contact started · ${res.data.contact_id || res.data.id}` : `Connected · ${res.data.id}`);
      setDest("");
      onCall?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Call failed");
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
        <span data-testid="connect-mode" className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${live ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
          {live ? "Live · AWS" : "Simulation"}
        </span>
      </div>

      {live && status?.instance_id && (
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">Instance {status.instance_id}{status.source_phone ? ` · ${status.source_phone}` : ""}</p>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {metricCards.map((c) => (
          <div key={c.label} data-testid={`connect-metric-${c.label.toLowerCase()}`} className="rounded-lg border border-border bg-secondary/30 p-2 text-center">
            <c.icon className="mx-auto h-3.5 w-3.5 text-accent" />
            <p className="mt-1 font-heading text-lg font-bold leading-none">{c.value}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {AGENT_STATES.map((s) => (
          <button key={s} data-testid={`agent-state-${s.toLowerCase().replace(/ /g, "-")}`} onClick={() => setAgentState(s)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${agentState === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>
            <Circle className="h-2 w-2 fill-current" /> {s}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Input
          data-testid="connect-destination-input"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder={live ? "Destination +14155550100" : "Destination (optional in sim)"}
          className="bg-secondary/50 font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button data-testid="connect-place-call" onClick={placeCall} disabled={dialing} className="flex-1 rounded-full bg-emerald-600 font-bold hover:bg-emerald-500">
            <Phone className="mr-2 h-4 w-4" /> {dialing ? "Dialing…" : live ? "Call via Connect" : "Place Call"}
          </Button>
          <Button variant="outline" onClick={() => setAgentState("After Work")} className="rounded-full border-border">
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="ac-scroll mt-4 max-h-40 space-y-2 overflow-y-auto">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Recent Contacts</p>
        {calls.length === 0 && <p className="text-sm text-muted-foreground">No calls yet.</p>}
        {calls.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-secondary/30 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent">{c.contact_id || c.id}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(c.started_at).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{c.destination ? `${c.destination} · ` : ""}{c.transcript}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
