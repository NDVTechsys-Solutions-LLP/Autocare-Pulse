import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, dealerCfg } from "@/lib/apiClient";
import { toast } from "sonner";

export default function ChatThread({ incidentId, role }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const base = role === "dealer" ? `/dealer/incidents/${incidentId}/chat` : `/incidents/${incidentId}/chat`;
  const cfg = role === "dealer" ? dealerCfg() : undefined;

  const load = async () => {
    try { const r = await api.get(base, cfg); setMessages(r.data); } catch { /* ignore */ }
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [incidentId]); // eslint-disable-line
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try { await api.post(base, { text: t }, cfg); setText(""); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Send failed"); }
    finally { setSending(false); }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#141720] p-4">
      <p className="mb-2.5 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Live Workshop Chat</p>
      <div className="ac-scroll mb-3 max-h-56 space-y-2.5 overflow-y-auto pr-1" data-testid="chat-thread">
        {messages.length === 0 && <p className="text-xs text-neutral-500 font-mono">No messages logged yet.</p>}
        {messages.map((m) => {
          if (m.sender === "system") return <p key={m.id} className="text-center font-mono text-[10px] uppercase tracking-wider text-neutral-500">{m.text}</p>;
          const mine = (role === "dealer" && m.sender === "agent") || (role === "customer" && m.sender === "customer");
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                data-testid={`chat-msg-${m.id}`}
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${
                  mine
                    ? "bg-[#00F0FF]/15 text-neutral-100 border border-[#00F0FF]/30"
                    : "bg-[#0e1015] text-neutral-200 border border-white/[0.08]"
                }`}
              >
                <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-semibold mb-0.5">{m.sender_name || m.sender}</p>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <Input
          data-testid="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type message to driver / specialist…"
          className="bg-[#0e1015] border-white/10 text-white placeholder:text-neutral-600 rounded-xl text-xs h-10"
        />
        <Button
          data-testid="chat-send-btn"
          onClick={send}
          disabled={sending}
          size="icon"
          className="rounded-full bg-white text-black hover:bg-neutral-200 shrink-0 h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
