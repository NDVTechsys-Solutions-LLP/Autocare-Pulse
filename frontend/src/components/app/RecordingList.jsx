import React, { useEffect, useState } from "react";
import { Play, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, dealerCfg } from "@/lib/apiClient";
import { toast } from "sonner";

export default function RecordingList({ incidentId }) {
  const [calls, setCalls] = useState([]);
  const [audio, setAudio] = useState({});
  const [keyInput, setKeyInput] = useState({});

  const load = async () => {
    try { const r = await api.get(`/dealer/connect/recordings/${incidentId}`, dealerCfg()); setCalls(r.data); } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, [incidentId]); // eslint-disable-line

  const play = async (id) => {
    try { const r = await api.get(`/dealer/connect/recording/${id}`, dealerCfg()); setAudio((a) => ({ ...a, [id]: r.data.url })); }
    catch (e) { toast.error(e.response?.data?.detail || "No recording available"); }
  };
  const attach = async (id) => {
    const val = (keyInput[id] || "").trim();
    if (!val) return;
    const payload = val.startsWith("http") ? { recording_url: val } : { recording_key: val };
    try { await api.post(`/dealer/connect/recording/${id}`, payload, dealerCfg()); toast.success("Recording attached"); play(id); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed to attach"); }
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-3" data-testid="recordings-section">
      <div className="mb-2 flex items-center gap-2">
        <Disc3 className="h-4 w-4 text-accent" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Call Recordings</p>
      </div>
      {calls.length === 0 && <p className="text-sm text-muted-foreground">No voice calls on this incident yet.</p>}
      <div className="space-y-2">
        {calls.map((c) => (
          <div key={c.id} data-testid={`recording-${c.id}`} className="rounded-lg border border-border bg-background p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent">{c.contact_id || c.id}</span>
              <Button data-testid={`recording-play-${c.id}`} onClick={() => play(c.id)} size="sm" variant="outline" className="rounded-full"><Play className="mr-1 h-3 w-3" />Play</Button>
            </div>
            {audio[c.id] && <audio data-testid={`recording-audio-${c.id}`} controls src={audio[c.id]} className="mt-2 w-full" />}
            <div className="mt-2 flex gap-2">
              <Input value={keyInput[c.id] || ""} onChange={(e) => setKeyInput((k) => ({ ...k, [c.id]: e.target.value }))} placeholder="Paste S3 key or recording URL" className="h-8 bg-secondary/50 text-xs" />
              <Button onClick={() => attach(c.id)} size="sm" variant="ghost">Attach</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
