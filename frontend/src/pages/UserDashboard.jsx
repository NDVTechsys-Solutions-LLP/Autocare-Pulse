import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, LogOut, Plus, Mic, Camera, Car, X, Sparkles, Upload, PhoneCall, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, API } from "@/lib/apiClient";
import { StatusBadge, PriorityBadge } from "@/components/app/Badges";
import VoiceRecorder from "@/components/app/VoiceRecorder";
import IncidentTimeline from "@/components/app/IncidentTimeline";
import ChatThread from "@/components/app/ChatThread";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/incidents");
      setIncidents(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const doLogout = async () => { await logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary"><Activity className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
          <span className="font-heading text-xl font-extrabold uppercase tracking-tight">AutoCare<span className="text-accent">Pulse</span></span>
          <span className="ml-2 hidden rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">Customer Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.picture && <img src={user.picture} alt="me" className="h-8 w-8 rounded-full border border-border" />}
          <span className="hidden text-sm font-semibold sm:inline">{user?.name}</span>
          <Button data-testid="user-logout-btn" onClick={doLogout} variant="ghost" size="icon" className="text-muted-foreground"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">My Incidents</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track every issue from report to resolution — transparently.</p>
          </div>
          <Button data-testid="new-incident-btn" onClick={() => setOpen(true)} className="rounded-full bg-primary font-bold uppercase tracking-wide hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Raise Incident
          </Button>
        </div>

        <div className="mt-8 grid gap-4">
          {loading && <p className="font-mono text-sm text-muted-foreground">Loading…</p>}
          {!loading && incidents.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <Car className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-heading text-xl">No incidents yet</p>
              <p className="text-sm text-muted-foreground">Raise your first one by voice or photo.</p>
            </div>
          )}
          {incidents.map((inc, i) => (
            <motion.button key={inc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              data-testid={`incident-card-${inc.id}`} onClick={() => setSelected(inc)}
              className="group rounded-xl border border-border bg-card p-5 text-left transition-colors duration-200 hover:border-accent/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{inc.id}</span>
                  <PriorityBadge priority={inc.priority} testid={`card-priority-${inc.id}`} />
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{inc.category}</span>
                </div>
                <StatusBadge status={inc.status} testid={`card-status-${inc.id}`} />
              </div>
              <h3 className="mt-3 font-heading text-xl font-semibold">{inc.title}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{inc.vehicle_model} · {inc.description}</p>
              {inc.assignee_name && <p className="mt-2 font-mono text-[11px] text-accent">Technician: {inc.assignee_name}</p>}
            </motion.button>
          ))}
        </div>
      </main>

      <NewIncidentDialog open={open} onOpenChange={setOpen} onCreated={(inc) => { setOpen(false); load(); setSelected(inc); }} />
      <DetailDialog incident={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function NewIncidentDialog({ open, onOpenChange, onCreated }) {
  const [tab, setTab] = useState("manual");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [desc, setDesc] = useState("");
  const [photoPaths, setPhotoPaths] = useState([]);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [selDealer, setSelDealer] = useState("");
  const [locating, setLocating] = useState(false);

  const reset = () => { setModel(""); setVin(""); setDesc(""); setPhotoPaths([]); setPreview(null); };

  useEffect(() => {
    if (!open) return;
    const fetchD = async (lat, lng) => {
      try {
        const r = await api.get("/dealerships", { params: lat != null ? { lat, lng } : {} });
        setDealers(r.data);
        if (r.data[0]) setSelDealer(r.data[0].id);
      } catch { /* ignore */ }
      setLocating(false);
    };
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchD(pos.coords.latitude, pos.coords.longitude),
        () => fetchD(),
        { timeout: 6000 }
      );
    } else { fetchD(); }
  }, [open]);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd);
      setPhotoPaths([res.data.path]);
      setPreview(URL.createObjectURL(file));
      toast.success("Photo attached");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!model.trim() || !desc.trim()) { toast.error("Add vehicle model and description"); return; }
    if (!selDealer) { toast.error("Choose a service center"); return; }
    setBusy(true);
    try {
      const res = await api.post("/incidents", { description: desc, vehicle_model: model, vehicle_vin: vin, source: tab === "voice" ? "voice" : "manual", photo_paths: photoPaths, dealership_id: selDealer });
      toast.success(`Incident ${res.data.id} raised · routed to ${res.data.dealership_name}`);
      reset();
      onCreated(res.data);
    } catch {
      toast.error("Failed to create incident");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight">Raise an Incident</DialogTitle>
          <DialogDescription>Describe your vehicle issue by text, voice or photo — AI triages it instantly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Choose a service center {locating && <span className="text-accent">· locating you…</span>}
            </Label>
            <div className="ac-scroll max-h-44 space-y-2 overflow-y-auto pr-1">
              {dealers.map((d) => (
                <button type="button" key={d.id} data-testid={`dealer-option-${d.id}`} onClick={() => setSelDealer(d.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors duration-200 ${selDealer === d.id ? "border-accent bg-accent/10" : "border-border bg-secondary/30 hover:border-accent/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-base font-semibold">{d.name}</span>
                    {d.recommended_reason && <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">{d.recommended_reason}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.city}{d.distance_km != null ? ` · ${d.distance_km} km` : ""}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{d.rating}</span>
                    <span>{d.services_count} serviced</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Vehicle Model</Label>
              <Input data-testid="incident-model-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Honda Activa 6G" className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">VIN (optional)</Label>
              <Input data-testid="incident-vin-input" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN / chassis" className="bg-secondary/50" />
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger data-testid="tab-manual" value="manual"><Plus className="mr-1.5 h-3.5 w-3.5" />Text</TabsTrigger>
              <TabsTrigger data-testid="tab-voice" value="voice"><Mic className="mr-1.5 h-3.5 w-3.5" />Voice</TabsTrigger>
              <TabsTrigger data-testid="tab-photo" value="photo"><Camera className="mr-1.5 h-3.5 w-3.5" />Photo</TabsTrigger>
            </TabsList>
            <TabsContent value="voice" className="pt-3">
              <VoiceRecorder onTranscript={(t) => setDesc((p) => (p ? p + " " : "") + t)} />
            </TabsContent>
            <TabsContent value="photo" className="pt-3">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
                {preview ? <img src={preview} alt="preview" className="h-32 rounded-lg object-cover" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{uploading ? "Uploading…" : "Click to upload car/bike photo"}</span>
                <input data-testid="incident-photo-input" type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
              </label>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Describe the issue</Label>
            <Textarea data-testid="incident-desc-input" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="What's wrong with the vehicle?" className="bg-secondary/50" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-muted-foreground">AI will auto-categorise, score severity and set priority the moment you submit.</p>
          </div>

          <Button data-testid="submit-incident-btn" onClick={submit} disabled={busy} className="w-full rounded-full bg-primary font-bold uppercase tracking-wide hover:bg-primary/90">
            {busy ? "Analysing with AI…" : "Submit Incident"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ incident, onClose }) {
  const [cbPhone, setCbPhone] = useState("");
  const [cbWhen, setCbWhen] = useState("");
  const [cbBusy, setCbBusy] = useState(false);
  const requestCallback = async () => {
    if (!cbPhone.trim()) { toast.error("Enter your phone number"); return; }
    setCbBusy(true);
    try {
      const payload = { phone: cbPhone.trim() };
      if (cbWhen) payload.scheduled_at = new Date(cbWhen).toISOString();
      await api.post(`/incidents/${incident.id}/callback`, payload);
      toast.success(cbWhen ? "Callback scheduled — we'll call at your chosen time" : "Callback requested — the dealer team will call you back");
      setCbPhone(""); setCbWhen("");
    }
    catch (e) { toast.error(e.response?.data?.detail || "Request failed"); }
    finally { setCbBusy(false); }
  };
  if (!incident) return null;
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-heading text-2xl uppercase tracking-tight">
            {incident.id}
          </DialogTitle>
          <DialogDescription>Live status, AI assessment and progress timeline for this incident.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} testid="detail-status" />
            <PriorityBadge priority={incident.priority} testid="detail-priority" />
            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{incident.category} · Sev {incident.severity}/5</span>
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">{incident.title}</h3>
            <p className="text-sm text-muted-foreground">{incident.vehicle_model}{incident.vehicle_vin ? ` · ${incident.vehicle_vin}` : ""}</p>
          </div>
          <p className="text-sm">{incident.description}</p>
          {incident.photo_paths?.length > 0 && (
            <img data-testid="detail-photo" src={`${API}/files/${incident.photo_paths[0]}`} alt="issue" className="max-h-56 w-full rounded-lg border border-border object-cover" />
          )}
          {incident.recommended_action && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent">AI Recommendation</p>
              <p className="mt-1 text-sm">{incident.recommended_action}</p>
            </div>
          )}
          {incident.assignee_name && <p className="font-mono text-sm text-accent">Technician: {incident.assignee_name}</p>}
          <div className="border-t border-border pt-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Live Progress</p>
            <IncidentTimeline incident={incident} />
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Request a Callback</p>
            <div className="flex gap-2">
              <Input data-testid="callback-phone-input" value={cbPhone} onChange={(e) => setCbPhone(e.target.value)} placeholder="Your phone e.g. +14155550100" className="bg-background" />
              <Button data-testid="request-callback-btn" onClick={requestCallback} disabled={cbBusy} className="rounded-full bg-primary font-bold hover:bg-primary/90">
                <PhoneCall className="mr-1.5 h-4 w-4" /> {cbBusy ? "Requesting…" : "Call Me"}
              </Button>
            </div>
            <input data-testid="callback-time-input" type="datetime-local" value={cbWhen} onChange={(e) => setCbWhen(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">Pick a time to schedule the callback, or leave empty to be called as soon as possible.</p>
          </div>

          <ChatThread incidentId={incident.id} role="customer" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
