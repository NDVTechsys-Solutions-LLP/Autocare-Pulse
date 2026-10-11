import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Wrench,
  CheckCircle2,
  XCircle,
  Mic,
  Camera,
  Cpu,
  Radio,
  Clock,
  MapPin,
  MessageSquare,
  Sparkles,
  PhoneCall,
  AlertTriangle,
  Car,
  Layers,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, dealerCfg } from "@/lib/apiClient";
import heroBg from "@/assets/hero-bg.jpg";

const TELEMATICS_IMG =
  "https://images.unsplash.com/photo-1694889648476-3777d917b91c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxlbGVjdHJpYyUyMGNhciUyMGRhc2hib2FyZCUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzg5NTAzMjk4fDA&ixlib=rb-4.1.0&q=85";
const WORKSHOP_IMG =
  "https://images.unsplash.com/photo-1765447650904-aeb3a8e17f2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwbW90b3JjeWNsZSUyMG1lY2hhbmljcyUyMGRlYWxlciUyMHdvcmtzaG9wfGVufDB8fHx8MTc4OTUwMzI5MXww&ixlib=rb-4.1.0&q=85";
const SUPPORT_IMG =
  "https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxjdXN0b21lciUyMHN1cHBvcnQlMjBhZ2VudCUyMGhlYWRzZXQlMjBjYWxsJTIwY2VudGVyfGVufDB8fHx8MTc4OTUwMzI5OHww&ixlib=rb-4.1.0&q=85";
const DIAGNOSTIC_IMG =
  "https://images.unsplash.com/photo-1585014165903-6d6c6ebad3e9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMGNhciUyMGRhc2hib2FyZCUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzg5NTAzMjk4fDA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  const navigate = useNavigate();
  const [dealerOpen, setDealerOpen] = useState(false);
  const [email, setEmail] = useState("ndvtechsys.solutions@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const dealerLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post("/auth/dealer/login", { email, password }, dealerCfg());
      localStorage.setItem("dealer_token", res.data.token);
      localStorage.setItem("dealer_info", JSON.stringify(res.data.dealer));
      toast.success(`Welcome, ${res.data.dealer.name}`);
      navigate("/dealer");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] font-body selection:bg-white/20 selection:text-white">
      {/* =========================================================================
          FIXED MINIMALIST NAVIGATION
          ========================================================================= */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-6 md:px-14 bg-[#090a0d]/85 backdrop-blur-md border-b border-white/[0.04]">
        {/* Brand Mark - Logo with Red Squircle & Cyan Pulse */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="cursor-pointer flex items-center gap-3 select-none hover:opacity-90 transition-opacity"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#E63946] shadow-[0_0_18px_rgba(230,57,70,0.45)] shrink-0">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-black text-xl tracking-tight text-white uppercase">
            AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 md:gap-8 font-heading text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium">
          <button onClick={() => scrollTo("section-01")} className="hover:text-white transition-colors hidden lg:block">
            Overview
          </button>
          <button onClick={() => scrollTo("section-02")} className="hover:text-white transition-colors hidden md:block">
            The Problem
          </button>
          <button onClick={() => scrollTo("section-03")} className="hover:text-white transition-colors hidden sm:block">
            How It Works
          </button>
          <button onClick={() => scrollTo("section-04")} className="hover:text-white transition-colors hidden lg:block">
            Portals
          </button>
          <button onClick={() => scrollTo("section-05")} className="hover:text-white transition-colors hidden md:block">
            Scenarios
          </button>
          <button onClick={() => scrollTo("section-06")} className="hover:text-white transition-colors">
            Access
          </button>

          {/* Dealer Login Modal Trigger */}
          <Dialog open={dealerOpen} onOpenChange={setDealerOpen}>
            <DialogTrigger asChild>
              <button
                data-testid="open-dealer-login"
                className="text-white border border-white/20 px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition-all duration-300 font-semibold"
              >
                Dealer Login
              </button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-[#0e1015] text-white max-w-md p-8 rounded-2xl shadow-2xl">
              <DialogHeader>
                <div className="flex flex-col font-heading font-black text-white text-xs tracking-[0.25em] uppercase text-neutral-400 mb-2">
                  <span>WORKSHOP CONSOLE</span>
                </div>
                <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
                  Dealer Authentication
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 font-light mt-1">
                  Access live incident intake, technician allocation, and workshop bay dispatch.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={dealerLogin} className="space-y-5 pt-4">
                <div className="space-y-1.5">
                  <Label className="font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                    Workshop Email
                  </Label>
                  <Input
                    data-testid="dealer-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#141720] border-white/10 text-white focus:border-white/40 h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                    Security Key / Password
                  </Label>
                  <Input
                    data-testid="dealer-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-[#141720] border-white/10 text-white focus:border-white/40 h-11 rounded-lg"
                  />
                </div>
                <button
                  data-testid="dealer-login-submit"
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-lg bg-white text-black font-heading font-bold uppercase text-xs tracking-[0.2em] hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {busy ? "Authenticating…" : "Enter Console →"}
                </button>
                <p className="text-center font-mono text-[10px] text-neutral-500">
                  Demo manager · ndvtechsys.solutions@gmail.com / DealerPass123!
                </p>
              </form>
            </DialogContent>
          </Dialog>
        </nav>
      </header>

      {/* =========================================================================
          SECTION .01 — HERO (CREATIVE TELEMATICS PULSE BACKGROUND)
          ========================================================================= */}
      <section
        id="section-01"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 pt-32 pb-12 border-b border-white/[0.05] overflow-hidden"
      >
        {/* Creative Telematics Pulse Background Layer with Smooth Vignette */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none">
          <img
            src={heroBg}
            alt="AutoCare Telematics Pulse Network"
            className="w-full h-full object-cover object-center opacity-30 md:opacity-40 scale-100 transform-gpu transition-opacity duration-700"
          />
          {/* Top Fade to seamless match navbar */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#090a0d] via-[#090a0d]/85 to-transparent" />
          {/* Bottom Fade to smoothly melt into Section .02 */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/90 to-transparent" />
          {/* Radial Center & Edge Vignette for Crisp Typographic Legibility */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,10,13,0.55)_0%,rgba(9,10,13,0.85)_65%,#090a0d_100%)]" />
        </div>

        {/* Top Spacer */}
        <div className="hidden md:block" />

        {/* Centerpiece Hero */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center my-auto">
          {/* Cyan Pill Eyebrow directly from Reference Image */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
            <span>OEM · DEALER · CUSTOMER</span>
          </motion.div>

          {/* Giant Stark White & Cyan Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.05em] uppercase text-white leading-none select-none"
          >
            AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
          </motion.h1>

          {/* Headline Phrase directly from Reference Image */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white mt-5"
          >
            INCIDENT COMMAND <span className="text-[#E63946]">FOR EVERY VEHICLE</span> ON THE ROAD
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-heading text-xs sm:text-sm font-medium tracking-[0.25em] uppercase text-neutral-400 mt-4 max-w-xl text-center leading-relaxed"
          >
            The Direct Telematics &amp; Service Bridge Between Drivers and Authorized Workshops
          </motion.p>

          {/* High-Value Plain English Summary */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-sm md:text-base text-neutral-300 max-w-xl font-light leading-relaxed text-center"
          >
            When your vehicle faces a breakdown, speak or snap a photo. AI instantly classifies the mechanical failure, routes the case to your nearest authorized workshop, dispatches roadside assistance with live GPS, and guarantees your repair timeline.
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {/* Customer Google Login */}
            <button
              data-testid="google-login-btn"
              onClick={googleLogin}
              className="group flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-white text-black font-heading font-bold text-xs uppercase tracking-[0.15em] hover:bg-neutral-200 transition-all duration-300 w-full sm:w-auto shadow-lg shadow-white/5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Driver Sign In (Google)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Dealer Portal Direct Button */}
            <button
              onClick={() => setDealerOpen(true)}
              className="px-8 py-3.5 rounded-full border border-white/20 text-neutral-300 font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.06] hover:text-white transition-all duration-300 w-full sm:w-auto"
            >
              Dealer Ops Console
            </button>
          </motion.div>

          {/* 3 Quick Value Highlights with Brand Accents */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-neutral-300">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
              Voice &amp; Photo AI Intake
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
              Live Roadside GPS Dispatch
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E63946] shadow-[0_0_8px_#E63946]" />
              Guaranteed 4-Hour Emergency SLA
            </span>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.01</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">OVERVIEW</span>
          </div>
          <div
            onClick={() => scrollTo("section-02")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .02 — THE REAL PROBLEM (BEFORE VS AFTER)
          ========================================================================= */}
      <section
        id="section-02"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24 border-b border-white/[0.05]"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-[#00F0FF] mb-3">
              THE STATUS QUO VS AUTOCARE PULSE
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              WHY VEHICLE BREAKDOWNS ARE BROKEN
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
              When a vehicle fails on the road, confusion costs hours. Compare the standard industry ordeal with the AutoCare Pulse experience.
            </p>
          </div>

          {/* Comparison Cards (Before vs After) */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* The Traditional Way */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-500">
                      CONVENTIONAL EXPERIENCE
                    </span>
                    <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-neutral-300 mt-1">
                      The Roadside Ordeal
                    </h3>
                  </div>
                  <XCircle className="h-6 w-6 text-[#E63946]" />
                </div>

                <div className="space-y-5 pt-6 text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-neutral-500 pt-0.5">01</span>
                    <p>
                      <strong className="text-neutral-200 font-medium">Endless Phone Trees:</strong> Stranded drivers wait on hold with generic call centers trying to explain ambiguous symptoms layperson terms.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-neutral-500 pt-0.5">02</span>
                    <p>
                      <strong className="text-neutral-200 font-medium">Zero Towing ETA:</strong> Drivers wait blindly for roadside assistance with no map, no driver contact, and no arrival estimate.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-neutral-500 pt-0.5">03</span>
                    <p>
                      <strong className="text-neutral-200 font-medium">The Workshop Black Hole:</strong> Once the vehicle arrives at the dealer, it sits in an unorganized intake queue for days with zero status updates.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-neutral-500 pt-0.5">04</span>
                    <p>
                      <strong className="text-neutral-200 font-medium">Zero Accountability:</strong> No guaranteed deadlines; critical safety issues get lost behind routine oil changes without escalation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] font-mono text-[11px] text-neutral-500">
                RESULT: High driver anxiety, lost shop revenue, and repeated calls.
              </div>
            </div>

            {/* The AutoCare Pulse Way */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/20 p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/35 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                  AUTOCARE PULSE STANDARD
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-[#00F0FF]">
                      CONNECTED TELEMATICS
                    </span>
                    <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-white mt-1">
                      The AutoCare Pulse Solution
                    </h3>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-[#00F0FF]" />
                </div>

                <div className="space-y-5 pt-6 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">01</span>
                    <p>
                      <strong className="text-white font-medium">5-Second AI Intake:</strong> Record a quick voice message or snap a photo. AI instantly transcribes and isolates the problem.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">02</span>
                    <p>
                      <strong className="text-white font-medium">Live GPS Rescue:</strong> Track the dispatched Roadside Assistance unit approaching on a live map with minutes-remaining countdown.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">03</span>
                    <p>
                      <strong className="text-white font-medium">Transparent Bay Allocation:</strong> See your car assigned to a specific technician with a booked bay slot and queue position (#2 of 4).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">04</span>
                    <p>
                      <strong className="text-white font-medium">Strict SLA Timers:</strong> High-priority incidents receive a strict 4-hour countdown with automatic OEM management escalation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] font-mono text-[11px] text-white/80">
                RESULT: Complete driver confidence, organized workshop bays, and zero phone tag.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.02</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">THE PROBLEM</span>
          </div>
          <div
            onClick={() => scrollTo("section-03")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .03 — HOW IT WORKS (THE 4-STEP LOOP)
          ========================================================================= */}
      <section
        id="section-03"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24 border-b border-white/[0.05]"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-3">
              SIMPLE 4-STEP LOOP
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              HOW AUTOCARE PULSE WORKS
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
              From roadside symptom to signed-off fix — a streamlined process designed for zero friction.
            </p>
          </div>

          {/* 4 Step Process Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-2.5 py-1 rounded">
                    STEP 01
                  </span>
                  <Mic className="h-5 w-5 text-[#00F0FF]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                  Report in Seconds
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Press Record and describe what happened, or snap a photo of the dashboard warning light or dent. Speech-to-text captures every detail without typing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Takes &lt; 15 seconds
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-2.5 py-1 rounded">
                    STEP 02
                  </span>
                  <Cpu className="h-5 w-5 text-[#00F0FF]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                  Instant AI Triage
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  AI categorizes the system (Engine, Brakes, Battery, Electrical, Tyres), calculates a 1–5 severity rating, and sets a strict SLA countdown timer.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Triaged in &lt; 2.5 seconds
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#E63946] bg-[#E63946]/15 border border-[#E63946]/30 px-2.5 py-1 rounded">
                    STEP 03
                  </span>
                  <Wrench className="h-5 w-5 text-[#E63946]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                  Workshop Dispatch
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Your nearest authorized dealership receives the diagnostic directive. They dispatch Roadside Assistance with live GPS, or reserve an express workshop bay.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Assigned to verified specialist
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#E63946] bg-[#E63946]/15 border border-[#E63946]/30 px-2.5 py-1 rounded">
                    STEP 04
                  </span>
                  <Clock className="h-5 w-5 text-[#E63946]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                  Live Resolution
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Watch live progress milestones, chat directly with the technician, reschedule bay appointments with one tap, and get guaranteed SLA completion.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                100% Transparent journey
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.03</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">HOW IT WORKS</span>
          </div>
          <div
            onClick={() => scrollTo("section-04")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .04 — TWO DEDICATED PORTALS (DRIVER VS DEALER)
          ========================================================================= */}
      <section
        id="section-04"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24 border-b border-white/[0.05]"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-3">
              TWO POWERFUL SIDES
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              BUILT FOR DRIVERS &amp; DEALERS
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
              AutoCare Pulse provides tailored tools for both vehicle owners on the road and dealership technicians in the workshop.
            </p>
          </div>

          {/* Two Split Portals */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Customer Portal Features */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400">
                      END USER APPLICATION
                    </span>
                    <h3 className="font-heading font-bold text-2xl uppercase tracking-tight text-white mt-1">
                      Driver Incident Portal
                    </h3>
                  </div>
                  <Car className="h-6 w-6 text-neutral-300" />
                </div>

                <div className="space-y-4 pt-6 text-xs sm:text-sm text-neutral-300 font-light">
                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Multimodal Voice &amp; Photo Intake
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Speak hands-free or take a photo of vehicle damage. Whisper AI transcribes accurately in real time.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Live Roadside Assistance GPS
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Track the recovery truck en route to your vehicle on a live GPS map with real-time ETA updates.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Bay Queue &amp; Reschedule Control
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      See your exact queue position (e.g. #2 in bay) and reschedule appointments with a single click.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Direct Technician Chat &amp; Callback
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Chat directly with the technician working on your car, or request an immediate phone callback.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-500">Protected with Google OAuth</span>
                <button
                  onClick={googleLogin}
                  className="font-heading text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
                >
                  <span>Launch Driver App</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Dealer Ops Console Features */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400">
                      WORKSHOP OPERATIONS
                    </span>
                    <h3 className="font-heading font-bold text-2xl uppercase tracking-tight text-white mt-1">
                      Dealer Command Console
                    </h3>
                  </div>
                  <Wrench className="h-6 w-6 text-neutral-300" />
                </div>

                <div className="space-y-4 pt-6 text-xs sm:text-sm text-neutral-300 font-light">
                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      AI Priority Orchestration Queue
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Filter incoming issues by High/Medium/Low priority. Critical safety items are highlighted with SLA countdowns.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Amazon Connect Cloud Softphone
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Built-in contact center CCP dialer with softphone calling, live call transcripts, and recorded audio logs.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      3-Tier Multi-Level OEM Escalation
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Automatic escalation ladder triggers if an issue nears SLA breach: Dealer &rarr; Regional Lead &rarr; OEM Quality VP.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Live Bay &amp; Technician Allocation
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Assign repair jobs to specialists, dispatch roadside units, and track team resolution metrics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-500">Authorized Workshop Personnel Only</span>
                <button
                  onClick={() => setDealerOpen(true)}
                  className="font-heading text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
                >
                  <span>Open Dealer Console</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.04</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">DUAL PORTALS</span>
          </div>
          <div
            onClick={() => scrollTo("section-05")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .05 — REAL-WORLD SCENARIOS (WHEN YOU NEED AUTOCARE PULSE)
          ========================================================================= */}
      <section
        id="section-05"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24 border-b border-white/[0.05]"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-[#00F0FF] mb-3">
              PRACTICAL ON-ROAD USE CASES
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              WHEN DO DRIVERS USE THIS?
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
              Three common situations where AutoCare Pulse replaces chaos with seamless execution.
            </p>
          </div>

          {/* 3 Practical Use Case Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Scenario 1 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-7 flex flex-col justify-between hover:border-[#E63946]/30 transition-all">
              <div>
                <span className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-[#E63946]">
                  SCENARIO 01 &bull; HIGH SEVERITY
                </span>
                <h3 className="font-heading font-bold text-xl uppercase tracking-wide text-white mt-2">
                  Highway Breakdown or Flat Tyre
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  You are stranded on the expressway with a blown tyre or sudden engine cutoff. You speak into your phone: <em>"Engine stalled on highway, won't turn over."</em>
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>AI flags <span className="text-[#E63946] font-semibold">High Priority</span> &bull; Dealer dispatches roadside unit &bull; Live GPS map shows truck arriving in 22 mins.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400">
                Resolution: Emergency Roadside Assistance
              </div>
            </div>

            {/* Scenario 2 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-7 flex flex-col justify-between hover:border-[#00F0FF]/30 transition-all">
              <div>
                <span className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-[#00F0FF]">
                  SCENARIO 02 &bull; DIAGNOSTIC
                </span>
                <h3 className="font-heading font-bold text-xl uppercase tracking-wide text-white mt-2">
                  Warning Light &amp; Strange Noise
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  Your ABS or Check Engine indicator lights up, accompanied by an unusual grinding brake noise. You record a voice note explaining the symptom.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>AI diagnoses brake rotor wear &bull; Suggests safe driving protocol &bull; Books an express workshop bay slot for tomorrow 10:00 AM.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400">
                Resolution: Express Workshop Bay Slot
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                  SCENARIO 03 &bull; VISION AI
                </span>
                <h3 className="font-heading font-bold text-xl uppercase tracking-wide text-white mt-2">
                  Collision or Body Damage
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  Minor parking collision leaves bumper and headlight damage. You snap two photos directly in the app.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>AI vision analyzes dent and panel integrity &bull; Dealer parts specialist prepares replacement parts prior to vehicle arrival.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400">
                Resolution: Pre-Assessed Body Repair
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.05</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">SCENARIOS</span>
          </div>
          <div
            onClick={() => scrollTo("section-06")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .06 — ACCESS & DIRECT PORTAL (Matching reference screen 3)
          ========================================================================= */}
      <section
        id="section-06"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Two-Column Split Layout matching Reference Screen 3 */}
          <div className="grid gap-12 lg:grid-cols-12 items-start">
            {/* Left Column: Context, Problem vs Solution, Operational Specs */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-2">
                  VERIFIED DEPLOYMENT
                </p>
                <h2 className="font-heading font-black text-4xl sm:text-5xl uppercase tracking-[0.08em] text-white">
                  DIRECT COMMAND
                </h2>
              </div>

              {/* The Problem vs Solution Explanation */}
              <div className="space-y-4 text-sm text-neutral-300 font-light leading-relaxed">
                <p>
                  <strong className="text-white font-medium">For Vehicle Owners:</strong> Never sit stranded in uncertainty again. Log issues instantly, watch rescue vehicles move on a live map, and track repairs down to the minute.
                </p>
                <p>
                  <strong className="text-white font-medium">For Authorized Dealerships:</strong> Receive structured intake data before cars touch the bay, keep foremen coordinated, and eliminate phone congestion.
                </p>
              </div>

              {/* Operational Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06]">
                  <p className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                    DIAGNOSTIC LATENCY
                  </p>
                  <p className="font-heading text-xl font-bold text-[#00F0FF] mt-1">
                    &lt; 2.5s Triage
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Whisper + Vision GPT-5.4</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06]">
                  <p className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                    EMERGENCY SLA
                  </p>
                  <p className="font-heading text-xl font-bold text-[#E63946] mt-1">
                    4-Hour Window
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Multi-tier OEM escalation</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06]">
                  <p className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                    WORKSHOP DISPATCH
                  </p>
                  <p className="font-heading text-xl font-bold text-[#00F0FF] mt-1">
                    Direct Bay Queue
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Live bay position &amp; ETA</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06]">
                  <p className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                    CLOUD CONTACT
                  </p>
                  <p className="font-heading text-xl font-bold text-[#00F0FF] mt-1">
                    Amazon Connect
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Softphone &amp; Call recording</p>
                </div>
              </div>

              {/* Quick Customer Access Bar */}
              <div className="p-5 rounded-xl border border-white/[0.1] bg-[#0e1015]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                    Need Emergency Vehicle Support?
                  </p>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">
                    Sign in to log an issue or view your active repairs.
                  </p>
                </div>
                <button
                  onClick={googleLogin}
                  className="px-5 py-2.5 rounded-full bg-white text-black font-heading text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors shrink-0"
                >
                  Customer Sign In →
                </button>
              </div>
            </div>

            {/* Right Column: Recessed Dark Form matching Screen 3 (Contact Form) */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#0e1015] border border-white/[0.1] p-8 sm:p-10 shadow-2xl relative">
                <div className="mb-6">
                  <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-1">
                    WORKSHOP ACCESS
                  </p>
                  <h3 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                    DEALER OPS CONSOLE
                  </h3>
                  <p className="text-xs text-neutral-400 font-light mt-1">
                    Sign in to supervise active workshop bays, dispatch RSA, and resolve incidents.
                  </p>
                </div>

                <form onSubmit={dealerLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-heading text-xs uppercase tracking-[0.15em] text-neutral-400">
                      Authorized Email
                    </Label>
                    <Input
                      data-testid="dealer-email-input-embedded"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="service.manager@dealership.com"
                      className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 focus:border-white/40 h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-heading text-xs uppercase tracking-[0.15em] text-neutral-400">
                      Security Password
                    </Label>
                    <Input
                      data-testid="dealer-password-input-embedded"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 focus:border-white/40 h-12 rounded-xl text-sm"
                    />
                  </div>

                  <button
                    data-testid="dealer-login-submit-embedded"
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 rounded-xl bg-white text-black font-heading font-bold uppercase text-xs tracking-[0.2em] hover:bg-neutral-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                  >
                    <span>{busy ? "Authenticating…" : "Enter Workshop Console"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center border-t border-white/[0.06]">
                    <p className="font-mono text-[11px] text-neutral-500">
                      Demo Manager: ndvtechsys.solutions@gmail.com / DealerPass123!
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-16">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.06</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">COMMAND ACCESS</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono tracking-widest">
            <div className="h-4 w-4 grid place-items-center rounded bg-[#E63946]">
              <Activity className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span>AUTOCARE<span className="text-[#00F0FF]">PULSE</span> &bull; ALL RIGHTS RESERVED</span>
          </div>

          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">BACK TO TOP</span>
            <span>↑</span>
          </div>
        </div>
      </section>
    </div>
  );
}
