import React, { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export default function VoiceRecorder({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob, "voice.webm");
          const res = await api.post("/voice/transcribe", fd);
          if (res.data.text?.trim()) {
            onTranscript(res.data.text.trim());
            toast.success("Voice transcribed");
          } else {
            toast.error("Couldn't catch that — try again");
          }
        } catch {
          toast.error("Transcription failed");
        } finally {
          setProcessing(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-secondary/30 p-6">
      <div className="relative">
        {recording && <span className="ac-pulse-ring absolute inset-0 rounded-full bg-primary/40" />}
        <button
          data-testid="voice-record-btn"
          onClick={recording ? stop : start}
          disabled={processing}
          className={`relative grid h-16 w-16 place-items-center rounded-full transition-colors duration-200 ${recording ? "bg-primary" : "bg-accent"} disabled:opacity-50`}
        >
          {processing ? <Loader2 className="h-6 w-6 animate-spin text-slate-900" /> : recording ? <Square className="h-6 w-6 text-white" fill="currentColor" /> : <Mic className="h-6 w-6 text-slate-900" />}
        </button>
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {processing ? "Transcribing…" : recording ? "Recording — tap to stop" : "Tap to describe by voice"}
      </p>
    </div>
  );
}
