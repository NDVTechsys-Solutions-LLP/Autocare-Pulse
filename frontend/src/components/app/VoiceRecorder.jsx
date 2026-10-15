import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, CheckCircle2, Volume2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export default function VoiceRecorder({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [livePreview, setLivePreview] = useState("");
  const [lastTranscribed, setLastTranscribed] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const speechTranscriptRef = useRef("");
  const timerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      speechTranscriptRef.current = "";
      setLivePreview("");
      setRecordSeconds(0);

      // Start duration counter
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // Dual engine: Native browser speech recognition for real-time live transcription
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = navigator.language || "en-US";
          rec.onresult = (evt) => {
            let finalStr = "";
            let interimStr = "";
            for (let i = 0; i < evt.results.length; i++) {
              if (evt.results[i].isFinal) {
                finalStr += evt.results[i][0].transcript + " ";
              } else {
                interimStr += evt.results[i][0].transcript;
              }
            }
            const full = (finalStr + interimStr).trim();
            if (full) {
              speechTranscriptRef.current = full;
              setLivePreview(full);
            }
          };
          rec.onerror = (err) => {
            console.warn("Browser SpeechRecognition:", err.error || err);
          };
          rec.start();
          speechRecognitionRef.current = rec;
        } catch (err) {
          console.warn("Speech recognition initialization:", err);
        }
      }

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());

        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch (_) {}
          speechRecognitionRef.current = null;
        }

        const localWords = speechTranscriptRef.current.trim();

        // High-precision AI Whisper transcription + translation
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
            setLastTranscribed(text);
            toast.success(`Voice Transcribed: "${text.length > 35 ? text.slice(0, 35) + "…" : text}"`);
          } else if (localWords) {
            // Fallback to local speech words if remote was blank
            onTranscript(localWords);
            setLastTranscribed(localWords);
            toast.success(`Voice Transcribed: "${localWords.length > 35 ? localWords.slice(0, 35) + "…" : localWords}"`);
          } else {
            toast.error("No speech detected — please speak clearly into your mic and try again");
          }
        } catch (e) {
          console.warn("Whisper remote transcription notice:", e);
          if (localWords) {
            onTranscript(localWords);
            setLastTranscribed(localWords);
            toast.success(`Voice Transcribed (local): "${localWords.length > 35 ? localWords.slice(0, 35) + "…" : localWords}"`);
          } else {
            const msg = e.response?.data?.detail || "Voice transcription unavailable";
            toast.error(msg);
          }
        } finally {
          setProcessing(false);
          setLivePreview("");
        }
      };

      mr.start(250);
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error("Microphone access error:", e);
      toast.error("Microphone access denied — please allow microphone permission in your browser");
    }
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#07090e] p-6 text-center transition-all duration-300">
      <div className="relative">
        {recording && (
          <span className="absolute -inset-1.5 rounded-full border border-[#e60012]/60 pointer-events-none" />
        )}
        <button
          type="button"
          data-testid="voice-record-btn"
          onClick={recording ? stop : start}
          disabled={processing}
          className={`relative grid h-16 w-16 place-items-center rounded-full transition-all duration-300 ${
            recording
              ? "bg-[#e60012] text-white border border-white/20 shadow-md"
              : "bg-white text-black hover:bg-neutral-200 shadow-sm"
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

      <div className="max-w-md w-full space-y-2">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white">
          {processing
            ? "Transcribing with AI Whisper…"
            : recording
            ? `Listening (${formatTime(recordSeconds)}) · Tap button when finished`
            : "Tap to record vehicle symptoms"}
        </p>

        {recording && (
          <div className="flex items-center justify-center gap-2 text-xs text-[#00F0FF]">
            <Volume2 className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-mono text-[11px] animate-pulse">
              Recording live audio… speak now
            </span>
          </div>
        )}

        {recording && livePreview && (
          <div className="rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 p-3 text-left animate-in fade-in">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF] block font-bold mb-1">
              Live Transcript:
            </span>
            <p className="text-xs text-white leading-relaxed font-medium">
              "{livePreview}"
            </p>
          </div>
        )}

        {lastTranscribed && !recording && !processing && (
          <div className="rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/5 p-3 text-left animate-in fade-in">
            <div className="flex items-center gap-1.5 text-[#00F0FF] font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Transcribed Speech Added:</span>
            </div>
            <p className="text-xs text-white leading-relaxed font-medium">
              "{lastTranscribed}"
            </p>
          </div>
        )}

        {!recording && !lastTranscribed && (
          <p className="text-[11px] font-mono text-neutral-400">
            Speech is automatically transcribed into your symptom report
          </p>
        )}
      </div>
    </div>
  );
}
