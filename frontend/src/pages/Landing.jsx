import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mic, Camera, Cpu, ShieldAlert, Radio, ArrowRight, Wrench, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, dealerCfg } from "@/lib/apiClient";

const HERO_IMG = "https://images.unsplash.com/photo-1694889648476-3777d917b91c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxlbGVjdHJpYyUyMGNhciUyMGRhc2hib2FyZCUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzg5NTAzMjk4fDA&ixlib=rb-4.1.0&q=85";

const FEATURES = [
  { icon: Mic, t: "Voice Intake", d: "Speak the issue — Whisper transcribes it instantly." },
  { icon: Camera, t: "Photo Capture", d: "Snap the damage; AI reads the image." },
  { icon: Cpu, t: "AI Orchestration", d: "GPT-5.4 auto-categorises & prioritises." },
  { icon: Radio, t: "Amazon Connect", d: "Dealer contact-center with live softphone." },
  { icon: ShieldAlert, t: "SLA Escalation", d: "Auto-escalates when KPIs breach." },
  { icon: Activity, t: "Live Tracking", d: "Transparent status from intake to fixed." },
];

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

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary shadow-[0_0_20px_rgba(230,57,70,0.4)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-2xl font-extrabold uppercase tracking-tight">AutoCare<span className="text-accent">Pulse</span></span>
        </div>
        <Dialog open={dealerOpen} onOpenChange={setDealerOpen}>
          <DialogTrigger asChild>
            <Button data-testid="open-dealer-login" variant="outline" className="rounded-full border-border bg-secondary/50 font-semibold hover:bg-secondary">
              <Building2 className="mr-2 h-4 w-4" /> Dealer Login
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading text-2xl uppercase tracking-tight flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Dealer Ops Console</DialogTitle></DialogHeader>
            <form onSubmit={dealerLogin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input data-testid="dealer-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input data-testid="dealer-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="DealerPass123!" required className="bg-secondary/50" />
              </div>
              <Button data-testid="dealer-login-submit" type="submit" disabled={busy} className="w-full rounded-full bg-primary font-bold uppercase tracking-wide hover:bg-primary/90">
                {busy ? "Authenticating…" : "Enter Console"}
              </Button>
              <p className="text-center font-mono text-[11px] text-muted-foreground">Demo manager · ndvtechsys.solutions@gmail.com / DealerPass123!</p>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Hero */}
      <section className="relative grid gap-10 px-6 pb-20 pt-10 md:grid-cols-2 md:px-12 md:pt-16">
        <div className="ac-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> OEM · Dealer · Customer
          </span>
          <h1 className="font-heading text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl">
            Incident command<br /><span className="text-primary">for every vehicle</span><br />on the road
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Raise a car or two-wheeler issue by voice or photo. AI triages it, your dealer's team owns it, and you watch it move — resolution, KPIs and escalation, all transparent.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button data-testid="google-login-btn" onClick={googleLogin} size="lg" className="group rounded-full bg-white px-6 font-bold text-slate-900 hover:bg-slate-100">
              <img alt="g" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="mr-2.5 h-5 w-5" />
              Continue with Google
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Customer portal</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative z-10">
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl">
            <img src={HERO_IMG} alt="Vehicle telematics dashboard" className="h-72 w-full object-cover md:h-[420px]" />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-accent/30 bg-card/90 p-4 shadow-[0_0_20px_rgba(0,240,255,0.15)] backdrop-blur-xl md:block">
            <p className="font-mono text-xs uppercase tracking-wider text-accent">AI Triage</p>
            <p className="font-heading text-xl font-bold">Engine · High · 4h SLA</p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 md:px-12">
        <h2 className="font-heading text-2xl font-bold uppercase tracking-tight sm:text-3xl">One loop. Total transparency.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors duration-200 hover:border-accent/50">
              <f.icon className="h-6 w-6 text-accent transition-transform duration-200 group-hover:scale-110" />
              <h3 className="mt-4 font-heading text-xl font-semibold">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
