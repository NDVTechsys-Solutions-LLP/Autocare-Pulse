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
    <div className="rounded-xl border border-white/[0.08] bg-[#141720] p-4" data-testid="recordings-section">
      <div className="mb-2.5 flex items-center gap-2">
        <Disc3 className="h-4 w-4 text-[#00F0FF]" />
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Call Recordings</p>
      </div>
      {calls.length === 0 && <p className="text-xs text-neutral-500 font-mono">No voice calls on this incident yet.</p>}
      <div className="space-y-2.5">
        {calls.map((c) => (
          <div key={c.id} data-testid={`recording-${c.id}`} className="rounded-xl border border-white/[0.06] bg-[#0e1015] p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[#00F0FF]">{c.contact_id || c.id}</span>
              <Button
                data-testid={`recording-play-${c.id}`}
                onClick={() => play(c.id)}
                size="sm"
                variant="outline"
                className="rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 text-xs font-heading font-semibold uppercase tracking-wider h-7 px-3"
              >
                <Play className="mr-1 h-3 w-3" />Play
              </Button>
            </div>
            {audio[c.id] && <audio data-testid={`recording-audio-${c.id}`} controls src={audio[c.id]} className="mt-2 w-full rounded" />}
            <div className="mt-2.5 flex gap-2">
              <Input
                value={keyInput[c.id] || ""}
                onChange={(e) => setKeyInput((k) => ({ ...k, [c.id]: e.target.value }))}
                placeholder="Paste S3 key or recording URL"
                className="h-8 bg-[#141720] border-white/10 text-white rounded-lg text-xs placeholder:text-neutral-600"
              />
              <Button
                onClick={() => attach(c.id)}
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-white/10"
              >
                Attach
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
