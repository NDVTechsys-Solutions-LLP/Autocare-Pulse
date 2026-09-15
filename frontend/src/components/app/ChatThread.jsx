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
    <div className="rounded-xl border border-border bg-secondary/20 p-3">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Live Chat</p>
      <div className="ac-scroll mb-2 max-h-56 space-y-2 overflow-y-auto pr-1" data-testid="chat-thread">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>}
        {messages.map((m) => {
          if (m.sender === "system") return <p key={m.id} className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.text}</p>;
          const mine = (role === "dealer" && m.sender === "agent") || (role === "customer" && m.sender === "customer");
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div data-testid={`chat-msg-${m.id}`} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-accent/20" : "bg-secondary"}`}>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{m.sender_name || m.sender}</p>
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <Input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="bg-background" />
        <Button data-testid="chat-send-btn" onClick={send} disabled={sending} size="icon" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
