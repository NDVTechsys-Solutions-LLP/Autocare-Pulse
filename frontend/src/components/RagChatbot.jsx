import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Search,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  MessageCircleQuestion,
} from "lucide-react";
import { api } from "@/lib/apiClient";

// AutoCare Pulse Logo Emblem
function AutoCarePulseLogo({ size = 32 }) {
  return (
    <div
      className="grid place-items-center rounded-xl bg-[#e60012] shrink-0 select-none shadow-sm"
      style={{ width: size, height: size }}
    >
      <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}

// Concise, grounded operational knowledge base
const RAG_QUESTIONS = [
  {
    id: "q-diagnostics",
    question: "How does fault diagnosis from photo or voice work?",
    keywords: ["photo", "voice", "diagnose", "image", "sound", "fault", "warning"],
    answer:
      "Upload a photo of your dashboard light or record a short voice description. The system analyzes the fault against standard OBD-II codes and advises whether your vehicle is safe to drive.",
  },
  {
    id: "q-dispatch-vs-workshop",
    question: "When is Roadside Towing dispatched versus booking a Workshop Bay?",
    keywords: ["roadside", "rescue", "workshop", "bay", "towing", "breakdown", "tow"],
    answer:
      "Immobilized or severe safety faults trigger an immediate roadside tow unit with real-time GPS tracking. Drivable vehicles are routed to nearby authorized workshops with open express bays.",
  },
  {
    id: "q-priority-tier",
    question: "What benefits does the Pulse Priority Tier provide?",
    keywords: ["priority", "membership", "tier", "fleet", "fast-track", "sla"],
    answer:
      "Priority tickets route directly to the top of the dealer manager's intake console, giving you first allocation on roadside rescue and guaranteed express workshop bays.",
  },
  {
    id: "q-dealer-console",
    question: "How do dealership managers receive diagnostic tickets?",
    keywords: ["dealer", "foreman", "console", "manager", "technician", "intake"],
    answer:
      "Service foremen access the Dealer Console (/dealer) to view incoming incident photos, voice notes, diagnostic codes, and required spare parts before the vehicle arrives.",
  },
  {
    id: "q-two-wheelers",
    question: "Are motorcycles, scooters, and EVs supported?",
    keywords: ["two-wheeler", "bike", "scooter", "motorcycle", "ev", "electric"],
    answer:
      "Yes. AutoCare Pulse supports cars, motorcycles, scooters, and electric two-wheelers with specialized checks for battery health, drive belts, and braking components.",
  },
  {
    id: "q-offline-sync",
    question: "What happens if a breakdown occurs with no network signal?",
    keywords: ["offline", "signal", "network", "remote", "dead zone", "cellular"],
    answer:
      "Incident photos, GPS coordinates, and voice descriptions are saved securely in local browser storage and automatically dispatch the instant connectivity is restored.",
  },
  {
    id: "q-obd-compatibility",
    question: "Which OBD-II scanners and vehicles are compatible?",
    keywords: ["obd", "obd2", "scanner", "bluetooth", "dongle", "compatibility"],
    answer:
      "Compatible with standard Bluetooth and Wi-Fi OBD-II dongles using ISO 15765-4 (CAN) protocols for passenger and light commercial vehicles built from 2008 onward.",
  },
  {
    id: "q-data-protection",
    question: "How is telemetry and location data protected?",
    keywords: ["privacy", "data", "security", "telemetry", "tracking", "encryption"],
    answer:
      "Telemetry streams are encrypted in transit via TLS 1.3 and at rest with AES-256. Location tracking is only active during live roadside assistance events.",
  },
  {
    id: "q-request-demo",
    question: "How do fleets and workshops schedule a demo?",
    keywords: ["demo", "enterprise", "fleet", "walkthrough", "dealership"],
    answer:
      "Click 'Request Demo' in the top bar and enter your details. An official confirmation email is dispatched immediately to your email address from AutoCare Pulse.",
  },
  {
    id: "q-get-quote",
    question: "How do I get a custom quote or contact the admin?",
    keywords: ["quote", "pricing", "code", "admin", "contact", "support"],
    answer:
      "Click 'Get a Quote' in the top bar to submit queries regarding workshop licensing or fleet pricing. An official quotation receipt will be sent directly to your email from AutoCare Pulse.",
  },
];

export default function RagChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Question report form
  const [reportText, setReportText] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [selectedQuestion, isOpen]);

  const filteredQuestions = RAG_QUESTIONS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reportText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setReportError("");
    setReportSuccess(false);

    try {
      const res = await api.post("/support/report-question", {
        question: trimmed,
        category: selectedQuestion ? "Follow-up Query" : "General Question",
        email: reportEmail.trim(),
        user_context: "AutoCare Pulse Assistant",
      });

      if (res.data?.ok) {
        setReportSuccess(true);
        setReportText("");
        setReportEmail("");
        setTimeout(() => setReportSuccess(false), 5000);
      } else {
        setReportError(res.data?.detail || "Could not report question. Please try again.");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to submit question.";
      setReportError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rag-chatboard-root" style={{ position: "relative", zIndex: 9999 }}>
      {/* 1. FLOATING AUTOCARE PULSE MASCOT LOGO BUTTON */}
      <div className="fixed bottom-6 right-6 z-[9999]" style={{ zIndex: 9999 }}>
        <button
          id="autocare-pulse-ragbot-launcher"
          data-testid="ragbot-launcher-btn"
          aria-label={isOpen ? "Close AutoCare Pulse Assistant" : "Open AutoCare Pulse Assistant"}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center justify-center w-13 h-13 rounded-2xl transition-all duration-200 cursor-pointer shadow-2xl ${
            isOpen
              ? "bg-[#0c111d] border border-white/20 text-white"
              : "bg-[#0c111d] border border-white/15 hover:border-white/30 text-white hover:scale-105 active:scale-95"
          }`}
          style={{ width: "52px", height: "52px", boxShadow: "0 10px 30px rgba(0,0,0,0.85)" }}
        >
          {isOpen ? (
            <X size={20} className="text-neutral-300 hover:text-white transition-colors" />
          ) : (
            <AutoCarePulseLogo size={34} />
          )}
        </button>
      </div>

      {/* 2. CHATBOARD POPUP WINDOW */}
      {isOpen && (
        <div
          id="autocare-pulse-ragbot-window"
          data-testid="ragbot-chat-window"
          className="fixed right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[390px] max-h-[80vh] h-[520px] flex flex-col rounded-2xl border border-white/15 bg-[#0c111d] overflow-hidden backdrop-blur-xl"
          style={{ bottom: "5.5rem", zIndex: 9999, boxShadow: "0 25px 60px rgba(0,0,0,0.9)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#07090e] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <AutoCarePulseLogo size={26} />
              <div>
                <h2 className="text-xs font-bold text-white tracking-wide uppercase font-heading">
                  AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-none">
                  Intelligent Triage &amp; FAQ
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Content Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-neutral-200">
            {/* VIEW A: ANSWER DETAILS */}
            {selectedQuestion ? (
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#00F0FF] hover:text-cyan-300 font-medium cursor-pointer transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>All Questions</span>
                </button>

                <div className="p-3.5 rounded-xl bg-[#07090e] border border-white/10 space-y-2.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                    {selectedQuestion.question}
                  </h3>
                  <div className="h-px bg-white/10 w-full" />
                  <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                    {selectedQuestion.answer}
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs border border-white/10 cursor-pointer transition-colors"
                  >
                    Ask Another Question
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW B: SEARCH & QUESTION LIST */
              <div className="space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search diagnostic, tow, workshop bay..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
                  />
                </div>

                {/* Question List Header */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                  <span>Questions ({filteredQuestions.length})</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Question Items */}
                <div className="space-y-1.5">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedQuestion(item)}
                        className="w-full text-left p-2.5 rounded-xl bg-[#07090e] hover:bg-white/5 border border-white/10 hover:border-white/20 transition-colors flex items-center justify-between gap-2.5 text-neutral-200 hover:text-white group cursor-pointer"
                      >
                        <span className="text-xs font-normal leading-snug">
                          {item.question}
                        </span>
                        <ChevronRight
                          size={13}
                          className="text-neutral-500 group-hover:text-[#00F0FF] group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-neutral-400 space-y-1.5">
                      <p className="text-xs">No questions match &ldquo;{searchQuery}&rdquo;</p>
                      <button
                        onClick={() => setReportText(searchQuery)}
                        className="text-xs text-[#00F0FF] hover:underline cursor-pointer"
                      >
                        Ask this to our admin &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. REPORT AN UNLISTED QUESTION */}
          <div className="p-3 border-t border-white/10 bg-[#07090e] shrink-0">
            <div className="mb-1.5">
              <h4 className="text-[11px] font-semibold text-white tracking-wider uppercase font-heading flex items-center gap-1.5">
                <MessageCircleQuestion size={12} className="text-[#00F0FF]" />
                <span>Can&apos;t find your question?</span>
              </h4>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-2">
              <input
                type="text"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Type your question..."
                required
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c111d] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
              />

              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  placeholder="Your email for confirmation..."
                  required
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0c111d] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !reportText.trim() || !reportEmail.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#00F0FF] hover:bg-[#00d8e6] text-[#090a0d] text-xs font-bold uppercase tracking-wider shrink-0 transition-all duration-200 disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>Report</span>
                </button>
              </div>

              {reportSuccess && (
                <div className="p-1.5 rounded-md bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
                  <span>Question reported! Confirmation sent to your email from AutoCare Pulse.</span>
                </div>
              )}

              {reportError && (
                <div className="p-1.5 rounded-md bg-red-950/30 border border-red-500/20 text-red-400 text-[11px] flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
