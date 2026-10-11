import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
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
  const [password, setPassword] = useState("DealerPass123!");
  const [busy, setBusy] = useState(false);

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const dealerLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    if (!cleanEmail || !cleanPassword) {
      toast.error("Please enter email and password");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/dealer/login", { email: cleanEmail, password: cleanPassword });
      localStorage.setItem("dealer_token", res.data.token);
      localStorage.setItem("dealer_info", JSON.stringify(res.data.dealer));
      toast.success(`Welcome, ${res.data.dealer.name}`);
      setDealerOpen(false);
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
        <nav className="flex items-center gap-5 md:gap-7 font-heading text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium">
          <button onClick={() => scrollTo("section-01")} className="hover:text-white transition-colors hidden xl:block">
            Overview
          </button>
          <button onClick={() => scrollTo("section-02")} className="hover:text-white transition-colors hidden lg:block">
            The Problem
          </button>
          <button onClick={() => scrollTo("section-03")} className="hover:text-white transition-colors hidden md:block">
            How It Works
          </button>
          <button onClick={() => scrollTo("section-04")} className="hover:text-white transition-colors hidden sm:block text-[#00F0FF]">
            AI Triage &amp; VIP
          </button>
          <button onClick={() => scrollTo("section-05")} className="hover:text-white transition-colors hidden lg:block">
            Portals
          </button>
          <button onClick={() => scrollTo("section-06")} className="hover:text-white transition-colors hidden md:block">
            Scenarios
          </button>
          <button onClick={() => scrollTo("section-07")} className="hover:text-white transition-colors">
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
                  className="w-full h-11 rounded-lg bg-white text-black font-heading font-bold uppercase text-xs tracking-[0.2em] hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                >
                  <span>{busy ? "Authenticating…" : "Enter Console →"}</span>
                </button>
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
          {/* Clean Typographic Eyebrow - Unboxed */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-heading text-xs font-semibold tracking-[0.3em] uppercase text-[#00F0FF] mb-4 select-none"
          >
            OEM &bull; DEALER &bull; CUSTOMER
          </motion.p>

          {/* Giant Stark White & Cyan Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.05em] uppercase text-white leading-none select-none"
          >
            AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
          </motion.h1>

          {/* Headline Phrase: AI Triage From Customer Input to Dealer Action */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white mt-5"
          >
            INTELLIGENT AI TRIAGE <span className="text-[#E63946]">FROM CUSTOMER INPUT</span> TO DEALER ACTION
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-heading text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-neutral-400 mt-4 max-w-2xl text-center leading-relaxed"
          >
            Instant photo analysis for cars &amp; bikes — guiding drivers to immediate dealer rescue or nearby authorized service centers with reserved bays.
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {/* Customer Google Login */}
            <button
              data-testid="google-login-btn"
              onClick={googleLogin}
              className="group flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-white text-black font-heading font-bold text-xs uppercase tracking-[0.15em] hover:bg-neutral-200 transition-all duration-300 w-full sm:w-auto shadow-lg shadow-white/5"
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
              className="px-8 py-3.5 rounded-xl border border-white/20 text-neutral-300 font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.06] hover:text-white transition-all duration-300 w-full sm:w-auto"
            >
              Dealer Ops Console
            </button>
          </motion.div>
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
            <p className="mt-5 text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed">
              When a car or two-wheeler faces a breakdown, confusion and endless queueing cost critical hours. AutoCare Pulse AI analyzes customer photos, determines whether to dispatch immediate roadside rescue or guide to nearby authorized service centers, and gives subscribed Priority Customers accelerated resolution.
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
                      <strong className="text-neutral-200 font-medium">Endless Phone Trees:</strong> Stranded drivers wait on hold with generic call centers trying to explain ambiguous symptoms in layperson terms.
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
                <span className="rounded-md bg-[#00F0FF]/15 border border-[#00F0FF]/35 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                  AUTOCARE PULSE STANDARD
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-[#00F0FF]">
                      CONNECTED TELEMATICS &bull; AI TRIAGE
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
                      <strong className="text-white font-medium">Photo &amp; Voice AI Triage (Cars &amp; Bikes):</strong> Driver snaps an image of vehicle damage or dashboard alert. AI Vision inspects severity and selects the best recovery path in &lt; 1.2s.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">02</span>
                    <p>
                      <strong className="text-white font-medium">Smart Branching (Roadside vs Service Center):</strong> Stranded on the road? AI dispatches immediate dealer rescue with live GPS. Drivable? AI recommends all nearby authorized service centers with live bay openings.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">03</span>
                    <p>
                      <strong className="text-white font-medium">Priority Customer Fast-Track:</strong> Subscribed Priority Customers bypass queues nationwide. Dealers receive an in-detail priority roster to expedite job cards first.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-white/60 pt-0.5">04</span>
                    <p>
                      <strong className="text-white font-medium">Strict SLA &amp; Peak Satisfaction:</strong> Dedicated technician assignment, real-time progress updates, and a guaranteed 4-hour countdown ensure vehicles return to the road faster.
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
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-[#00F0FF] mb-3">
              SIMPLE 4-STEP LOOP
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              HOW AUTOCARE PULSE WORKS
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
              From roadside photo capture to authorized dealer sign-off — an intelligent loop designed for speed, clarity, and prioritized care.
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
                  <Camera className="h-5 w-5 text-[#00F0FF]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                  Photo &amp; Voice Intake
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Snap a photo of the vehicle issue (car or bike) or record a voice note. Whisper AI &amp; computer vision ingest visual damage and symptom descriptions in seconds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Cars &amp; Two-Wheelers
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
                  AI Triage &amp; Decision
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  AI chooses the optimal path: dispatches Immediate Dealer Rescue if non-drivable, or recommends nearby authorized service centers with reserved bays if drivable.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Decisioned in &lt; 1.2s
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
                  Dealer Handshake
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Diagnostics route straight to the dealership console. Subscribed Priority Customers flash at the top of the dealer's VIP queue for immediate technician allocation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Priority VIP Queue
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
                  Rapid Resolution
                </h3>
                <p className="mt-3 text-xs text-neutral-400 font-light leading-relaxed">
                  Track live recovery GPS and workshop bay milestones, chat with mechanics directly, and experience accelerated turnaround under strict SLA completion.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                Peak Customer Satisfaction
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
          SECTION .04 — AI TRIAGE ENGINE & PRIORITY CUSTOMER SUBSCRIPTION
          ========================================================================= */}
      <section
        id="section-04"
        className="relative min-h-screen flex flex-col justify-between px-6 md:px-14 py-24 border-b border-white/[0.05]"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full my-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-[#00F0FF] mb-3">
              INTELLIGENT DECISION ENGINE &bull; NATIONWIDE VIP SCALE
            </p>
            <h2 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-white">
              AI TRIAGE &amp; PRIORITY SUBSCRIPTION
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
              How AutoCare Pulse analyzes car and bike issues via image or voice, calculates the optimal customer outcome, and delivers accelerated dealer resolution for millions of vehicle owners.
            </p>
          </div>

          {/* Two-Column Deep Dive */}
          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            {/* Left Card: AI Triage Decision Engine */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-8 sm:p-10 flex flex-col justify-between hover:border-[#00F0FF]/30 transition-all">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-[#00F0FF]">
                      MULTIMODAL DIAGNOSTIC ENGINE
                    </span>
                    <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-white mt-1">
                      Intelligent AI Triage Working
                    </h3>
                  </div>
                  <Cpu className="h-6 w-6 text-[#00F0FF]" />
                </div>

                <div className="space-y-4 pt-6 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  <p className="text-neutral-300">
                    When a customer encounters trouble on the road or at home, they upload an image or voice note describing the defect affecting their car or bike. AI Vision instantly analyzes the mechanical fault, warning light, or collision damage.
                  </p>

                  <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E63946]" />
                      <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
                        Outcome Path A — Immediate Dealer Roadside Assistance
                      </h4>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      If the vehicle is immobilized, unsafe to drive, or stranded on a highway (e.g. engine blowout, tyre puncture, critical brake failure), AI immediately initiates emergency dealer dispatch. A recovery unit is deployed with live GPS telemetry and real-time tracking.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#00F0FF]" />
                      <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
                        Outcome Path B — Guided Nearby Authorized Service Centers
                      </h4>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      If the vehicle remains safely drivable (e.g. sensor warning, minor suspension noise, scheduled maintenance), AI presents all verified nearby authorized service centers within radius. Drivers see live bay wait times and can reserve an express bay slot instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>Vision AI + Whisper Transcription</span>
                <span className="text-[#00F0FF]">&lt; 1.2s Decision Latency</span>
              </div>
            </div>

            {/* Right Card: Priority Customer Subscription */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/20 p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative hover:border-[#E63946]/40 transition-all">
              <div className="absolute top-4 right-4">
                <span className="rounded-md bg-[#E63946]/15 border border-[#E63946]/35 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-[#E63946]">
                  VIP SERVICE TIER
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="font-heading text-[10px] font-bold tracking-[0.25em] uppercase text-[#E63946]">
                      NATIONWIDE SCALE (LAKHS &amp; CRORES OF VEHICLES)
                    </span>
                    <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-white mt-1">
                      Priority Customer Subscription
                    </h3>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-[#E63946]" />
                </div>

                <div className="space-y-4 pt-6 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  <p className="text-neutral-300">
                    With lakhs and crores of vehicle owners on Indian roads, workshop queues and roadside delays can leave drivers waiting for hours. By subscribing to the <strong className="text-white font-medium">Pulse Priority Membership</strong>, customers unlock guaranteed fast-track care.
                  </p>

                  <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E63946]" />
                      <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
                        Dedicated Dealer Priority Customer Roster
                      </h4>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      Authorized service center foremen and dealers gain a dedicated, filtered list of Priority Customers. Whenever a subscriber faces a breakdown, their job ticket flashes at the top of the technician queue with comprehensive vehicle history.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#00F0FF]" />
                      <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
                        Accelerated AI &amp; Dealer Assistance
                      </h4>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      Priority subscribers bypass ordinary queues. AI compute is accelerated, roadside recovery trucks are assigned first, and workshop bays are reserved before arrival — resolving issues substantially faster and elevating customer satisfaction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>Cuts Resolution Downtime by 60%</span>
                <span className="text-[#E63946]">Guaranteed Priority SLA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.04</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">AI TRIAGE &amp; VIP</span>
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
          SECTION .05 — TWO DEDICATED PORTALS (DRIVER VS DEALER)
          ========================================================================= */}
      <section
        id="section-05"
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
                      Multimodal Photo &amp; Voice AI Intake
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Take a photo of vehicle damage or speak hands-free. AI analyzes defects for cars and two-wheelers in real time.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Nearby Service Centers &amp; Bay Booking
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Browse certified authorized workshops nearby with live distance, queue times, and one-tap bay slot reservations.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Pulse Priority Subscription Pass
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Enjoy VIP status nationwide. Bypass waiting queues with accelerated AI compute and fast-track dealer assistance.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Live Roadside GPS &amp; Mechanic Chat
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Track approaching recovery units on live GPS maps and chat directly with your assigned workshop technician.
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
                      Dedicated Priority Customer Roster
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Access an in-detail list of subscribed Priority Customers for immediate diagnostic allocation and VIP workshop attention.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      AI Triage &amp; Pathway Directive
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Pre-analyzed incident data indicating whether the vehicle requires roadside rescue or express bay check-in.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      Amazon Connect Cloud Softphone
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Integrated CCP softphone dialer with live transcripts, audio recordings, and one-click customer callbacks.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141720]/80 border border-white/[0.04]">
                    <h4 className="font-heading font-bold text-white text-sm uppercase">
                      3-Tier Multi-Level OEM Escalation
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">
                      Automated escalation prevents SLA breaches: Dealer foreman &rarr; Regional Service Lead &rarr; OEM Quality VP.
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
            <span className="font-bold text-neutral-400">.05</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">DUAL PORTALS</span>
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
          SECTION .06 — REAL-WORLD SCENARIOS (WHEN YOU NEED AUTOCARE PULSE)
          ========================================================================= */}
      <section
        id="section-06"
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
                  Highway Breakdown (Stranded Car or Bike)
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  Stranded on the expressway with a blown tyre or sudden engine cutoff. You speak into your phone: <em>"Engine stalled on highway, won't turn over."</em>
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>AI diagnoses non-drivable state &bull; Flags <span className="text-[#E63946] font-semibold">High Priority</span> &bull; Dispatches dealer rescue truck with live GPS arriving in 22 mins.</p>
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
                  Warning Light &amp; Drivable Vehicle
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  Your ABS or Check Engine indicator lights up, accompanied by an unusual grinding brake noise. You record a voice note explaining the symptom.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>AI confirms car is safely drivable &bull; Suggests all nearby authorized service centers with live queue times &bull; Books express bay slot for tomorrow 10:00 AM.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400">
                Resolution: Nearby Service Center Bay Booking
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="rounded-2xl bg-[#0e1015] border border-white/[0.08] p-7 flex flex-col justify-between hover:border-[#E63946]/30 transition-all">
              <div>
                <span className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-[#E63946]">
                  SCENARIO 03 &bull; VIP PRIORITY TIER
                </span>
                <h3 className="font-heading font-bold text-xl uppercase tracking-wide text-white mt-2">
                  Priority Customer Damage Intake
                </h3>
                <p className="mt-3 text-xs text-neutral-300 font-light leading-relaxed">
                  A subscribed Priority Member experiences bumper or panel damage in a parking scrape. They snap two photos directly in the app.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-[#141720] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                  <p className="text-[#00F0FF] font-medium">AutoCare Pulse Action:</p>
                  <p>Dealer console highlights <span className="text-[#E63946] font-semibold">Priority Customer Alert</span> &bull; Parts staged immediately &bull; Vehicle enters express bay ahead of queue.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-neutral-400">
                Resolution: Fast-Track VIP Workshop Repair
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.06</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.25em]">SCENARIOS</span>
          </div>
          <div
            onClick={() => scrollTo("section-07")}
            className="cursor-pointer flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span className="text-[10px]">SCROLL</span>
            <span>—</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION .07 — ACCESS & DIRECT PORTAL (Matching reference screen 3)
          ========================================================================= */}
      <section
        id="section-07"
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
                    &lt; 1.2s Triage
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Whisper + Vision GPT-5.4</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06]">
                  <p className="font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                    NATIONWIDE SCALE
                  </p>
                  <p className="font-heading text-xl font-bold text-[#E63946] mt-1">
                    Lakhs &amp; Crores
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Distributed VIP telematics</p>
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
                    EMERGENCY SLA
                  </p>
                  <p className="font-heading text-xl font-bold text-[#E63946] mt-1">
                    4-Hour Window
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Priority fast-track &amp; escalation</p>
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
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Indicators */}
        <div className="relative z-10 flex items-end justify-between font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 pt-16">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400">.07</span>
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
