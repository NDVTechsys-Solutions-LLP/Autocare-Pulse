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
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const options = mimeType ? { mimeType } : undefined;
      const mr = new MediaRecorder(stream, options);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data && e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setProcessing(true);
        try {
          const actualMime = mr.mimeType || "audio/webm";
          const ext = actualMime.includes("mp4") ? "mp4" : "webm";
          const blob = new Blob(chunksRef.current, { type: actualMime });
          const fd = new FormData();
          fd.append("file", blob, `voice.${ext}`);
          const res = await api.post("/voice/transcribe", fd);
          const text = (res.data?.text || "").trim();
          if (text) {
            onTranscript(text);
            toast.success("Voice transcribed successfully");
          } else {
            toast.error("No audible speech detected — please try again");
          }
        } catch (e) {
          console.error("Transcription error:", e);
          const msg = e.response?.data?.detail || "Voice transcription service unavailable";
          toast.error(msg);
        } finally {
          setProcessing(false);
        }
      };
      mr.start(250);
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error("Microphone error:", e);
      toast.error("Microphone permission denied or audio device not found");
    }
  };

  const stop = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#141720]/80 p-8 text-center transition-all duration-300">
      <div className="relative">
        {recording && (
          <span className="absolute -inset-2 rounded-full bg-[#E63946]/30 animate-ping pointer-events-none" />
        )}
        <button
          type="button"
          data-testid="voice-record-btn"
          onClick={recording ? stop : start}
          disabled={processing}
          className={`relative grid h-16 w-16 place-items-center rounded-full transition-all duration-300 ${
            recording
              ? "bg-[#E63946] text-white shadow-[0_0_25px_rgba(230,57,70,0.6)]"
              : "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5"
          } disabled:opacity-50`}
        >
          {processing ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          ) : recording ? (
            <Square className="h-6 w-6 text-white" fill="currentColor" />
          ) : (
            <Mic className="h-6 w-6 text-black" strokeWidth={2.5} />
          )}
        </button>
      </div>
      <div>
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white">
          {processing
            ? "Transcribing with AI Whisper…"
            : recording
            ? "Recording audio · Tap to stop"
            : "Tap to record vehicle symptoms"}
        </p>
        <p className="text-[11px] font-mono text-neutral-400 mt-1">
          {recording
            ? "Speak clearly about the issue (e.g. engine noise, brakes, battery)"
            : "Whisper AI automatically transcribes speech into symptom text"}
        </p>
      </div>
    </div>
  );
}
