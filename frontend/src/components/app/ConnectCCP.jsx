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
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Radio className="h-5 w-5 text-[#00F0FF]" />
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Amazon Connect CCP</h3>
        </div>
        <span
          data-testid="connect-mode"
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${
            live
              ? "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30"
              : "bg-white/[0.08] text-neutral-300 border border-white/15"
          }`}
        >
          {live ? "Live · AWS" : "Simulation"}
        </span>
      </div>

      {live && status?.instance_id && (
        <p className="mt-1 truncate font-mono text-[10px] text-neutral-400">
          Instance {status.instance_id}{status.source_phone ? ` · ${status.source_phone}` : ""}
        </p>
      )}

      <div className="mt-5 grid grid-cols-4 gap-2">
        {metricCards.map((c) => (
          <div
            key={c.label}
            data-testid={`connect-metric-${c.label.toLowerCase()}`}
            className="rounded-xl border border-white/[0.06] bg-[#141720] p-2.5 text-center"
          >
            <c.icon className="mx-auto h-3.5 w-3.5 text-[#00F0FF]" />
            <p className="mt-1.5 font-heading text-lg font-black text-white leading-none">{c.value}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {AGENT_STATES.map((s) => (
          <button
            key={s}
            data-testid={`agent-state-${s.toLowerCase().replace(/ /g, "-")}`}
            onClick={() => setAgentState(s)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${
              agentState === s
                ? "border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]"
                : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
            }`}
          >
            <Circle className="h-2 w-2 fill-current" /> {s}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <Input
          data-testid="connect-destination-input"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder={live ? "Destination +14155550100" : "Destination (optional in sim)"}
          className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 rounded-xl font-mono text-xs h-10"
        />
        <div className="flex gap-2">
          <Button
            data-testid="connect-place-call"
            onClick={placeCall}
            disabled={dialing}
            className="flex-1 rounded-full bg-white hover:bg-neutral-200 font-heading text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-white/10"
          >
            <Phone className="mr-2 h-4 w-4" /> {dialing ? "Dialing…" : live ? "Call via Connect" : "Place Call"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setAgentState("After Work")}
            className="rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:border-white/30"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2.5">
          Recent Contacts
        </p>
        <div className="ac-scroll max-h-44 space-y-2 overflow-y-auto">
          {calls.length === 0 && <p className="text-xs text-neutral-500 font-mono">No voice calls registered yet.</p>}
          {calls.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/[0.06] bg-[#141720] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#00F0FF]">{c.contact_id || c.id}</span>
                <span className="font-mono text-[10px] text-neutral-400">{new Date(c.started_at).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 truncate text-xs text-neutral-300 font-light">
                {c.destination ? `${c.destination} · ` : ""}{c.transcript}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
