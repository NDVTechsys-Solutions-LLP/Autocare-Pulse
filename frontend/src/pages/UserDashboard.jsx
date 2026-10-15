import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogOut,
  Plus,
  Mic,
  Camera,
  Car,
  Sparkles,
  Upload,
  PhoneCall,
  MapPin,
  Star,
  ArrowUpRight,
  Shield,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, API } from "@/lib/apiClient";
import { StatusBadge, PriorityBadge } from "@/components/app/Badges";
import VoiceRecorder from "@/components/app/VoiceRecorder";
import IncidentTimeline from "@/components/app/IncidentTimeline";
import ChatThread from "@/components/app/ChatThread";
import RsaTracker from "@/components/app/RsaTracker";

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
      setSelected((prev) => (prev ? res.data.find((i) => i.id === prev.id) || prev : null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e5e7eb] font-body selection:bg-white/20 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#07090e]/90 px-6 py-5 backdrop-blur-md md:px-12">
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-3 select-none hover:opacity-90 transition-opacity"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e60012] shrink-0">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-lg tracking-tight text-white uppercase">
              AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
            </span>
          </div>
          <span className="h-4 w-px bg-white/10 hidden sm:block" />
          <span className="hidden sm:inline font-heading text-xs font-semibold tracking-[0.2em] uppercase text-neutral-400">
            DRIVER CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user?.picture && (
            <img
              src={user.picture}
              alt="Profile"
              className="h-8 w-8 rounded-full border border-white/20 object-cover"
            />
          )}
          <span className="hidden text-xs font-medium text-neutral-300 md:inline tracking-wide">
            {user?.name}
          </span>
          <button
            data-testid="user-logout-btn"
            onClick={doLogout}
            title="Sign Out"
            className="p-2 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-12">
        {/* Top Control Bar */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end pb-8 border-b border-white/[0.06]">
          <div>
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-1">
              TELEMATICS OVERVIEW
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              INCIDENT REGISTER
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 font-light">
              Live status, automated diagnostics &amp; verified dealership workshop progress.
            </p>
          </div>

          <button
            data-testid="new-incident-btn"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-heading font-bold text-xs uppercase tracking-[0.15em] hover:bg-neutral-200 transition-all duration-300 shadow-lg shadow-white/5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Raise Incident</span>
          </button>
        </div>

        {/* Incident List */}
        <div className="mt-8 space-y-4">
          {loading && (
            <div className="py-12 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Synchronizing telematics queue…
              </p>
            </div>
          )}

          {!loading && incidents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0c111d]/40 p-16 text-center">
              <Car className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                No Active Incidents
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1 max-w-sm mx-auto">
                Your vehicles are clear. Click 'Raise Incident' above to log a breakdown via voice, photo or text.
              </p>
            </div>
          )}

          {incidents.map((inc, i) => (
            <motion.button
              key={inc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              data-testid={`incident-card-${inc.id}`}
              onClick={() => setSelected(inc)}
              className="group w-full rounded-2xl bg-[#0c111d] border border-white/[0.08] hover:border-white/20 p-6 text-left transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-neutral-400 tracking-wider">
                    {inc.id}
                  </span>
                  <PriorityBadge priority={inc.priority} testid={`card-priority-${inc.id}`} />
                  <span className="rounded bg-white/[0.06] border border-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                    {inc.category}
                  </span>
                </div>
                <StatusBadge status={inc.status} testid={`card-status-${inc.id}`} />
              </div>

              <div className="mt-4">
                <h3 className="font-heading text-xl font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {inc.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs text-neutral-400 font-light">
                  <span className="text-white font-medium">{inc.vehicle_model}</span> · {inc.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>
                  {inc.dealership_name ? `Workshop: ${inc.dealership_name}` : "Pending assignment"}
                </span>
                <span className="text-white group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Detail <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <NewIncidentDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(inc) => {
          setOpen(false);
          load();
          setSelected(inc);
        }}
      />
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

  const reset = () => {
    setModel("");
    setVin("");
    setDesc("");
    setPhotoPaths([]);
    setPreview(null);
  };

  useEffect(() => {
    if (!open) return;
    const fetchD = async (lat, lng) => {
      try {
        const r = await api.get("/dealerships", { params: lat != null ? { lat, lng } : {} });
        setDealers(r.data);
        if (r.data[0]) setSelDealer(r.data[0].id);
      } catch {
        /* ignore */
      }
      setLocating(false);
    };
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchD(pos.coords.latitude, pos.coords.longitude),
        () => fetchD(),
        { timeout: 6000 }
      );
    } else {
      fetchD();
    }
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
    if (!model.trim() || !desc.trim()) {
      toast.error("Add vehicle model and description");
      return;
    }
    if (!selDealer) {
      toast.error("Choose a service center");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/incidents", {
        description: desc,
        vehicle_model: model,
        vehicle_vin: vin,
        source: tab === "voice" ? "voice" : "manual",
        photo_paths: photoPaths,
        dealership_id: selDealer,
      });
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0c111d] text-white sm:max-w-lg p-8 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex flex-col font-heading font-black text-white text-xs tracking-[0.25em] uppercase text-neutral-400 mb-1">
            <span>INTAKE ENGINE</span>
          </div>
          <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
            Log Vehicle Incident
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 font-light mt-1">
            Provide issue symptoms via voice, photo or text. AI performs instant fault classification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Workshop Center Selector */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
              <span>Select Authorized Workshop</span>
              {locating && <span className="text-neutral-400 font-mono text-[10px]">· locating…</span>}
            </Label>
            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {dealers.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  data-testid={`dealer-option-${d.id}`}
                  onClick={() => setSelDealer(d.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    selDealer === d.id
                      ? "border-white/40 bg-white/[0.08]"
                      : "border-white/[0.06] bg-[#141720]/60 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm font-bold text-white">{d.name}</span>
                    {d.recommended_reason && (
                      <span className="rounded bg-white/10 border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-300">
                        {d.recommended_reason}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {d.city}
                      {d.distance_km != null ? ` · ${d.distance_km} km` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {d.rating}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Model and VIN */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                Vehicle Model
              </Label>
              <Input
                data-testid="incident-model-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. BMW 330i / Activa 6G"
                className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                VIN / Chassis
              </Label>
              <Input
                data-testid="incident-vin-input"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Optional VIN"
                className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Input Modality Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 bg-[#141720] border border-white/[0.06] rounded-xl p-1">
              <TabsTrigger
                data-testid="tab-manual"
                value="manual"
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-semibold uppercase tracking-wider"
              >
                Text
              </TabsTrigger>
              <TabsTrigger
                data-testid="tab-voice"
                value="voice"
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-semibold uppercase tracking-wider"
              >
                <Mic className="mr-1.5 h-3.5 w-3.5" />
                Voice
              </TabsTrigger>
              <TabsTrigger
                data-testid="tab-photo"
                value="photo"
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-semibold uppercase tracking-wider"
              >
                <Camera className="mr-1.5 h-3.5 w-3.5" />
                Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="pt-3">
              <VoiceRecorder onTranscript={(t) => setDesc((p) => (p ? p + " " : "") + t)} />
            </TabsContent>

            <TabsContent value="photo" className="pt-3">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#141720]/60 p-6 text-center hover:border-white/40 transition-colors">
                {preview ? (
                  <img src={preview} alt="preview" className="h-32 rounded-lg object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-neutral-500" />
                )}
                <span className="font-heading text-xs uppercase tracking-wider text-neutral-400">
                  {uploading ? "Analyzing image…" : "Upload Vehicle Damage Photo"}
                </span>
                <input
                  data-testid="incident-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadPhoto}
                />
              </label>
            </TabsContent>
          </Tabs>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-heading text-[11px] uppercase tracking-[0.15em] text-neutral-400">
              Symptom Description
            </Label>
            <Textarea
              data-testid="incident-desc-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Describe symptoms, strange noises, warning lights or visible damage…"
              className="bg-[#141720] border-white/10 text-white placeholder:text-neutral-600 rounded-xl text-sm"
            />
          </div>

          <button
            data-testid="submit-incident-btn"
            onClick={submit}
            disabled={busy}
            className="w-full h-11 rounded-xl bg-white text-black font-heading font-bold uppercase text-xs tracking-[0.2em] hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {busy ? "Triage in progress…" : "Dispatch Incident →"}
          </button>
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
    if (!cbPhone.trim()) {
      toast.error("Enter your phone number");
      return;
    }
    setCbBusy(true);
    try {
      const payload = { phone: cbPhone.trim() };
      if (cbWhen) payload.scheduled_at = new Date(cbWhen).toISOString();
      await api.post(`/incidents/${incident.id}/callback`, payload);
      toast.success(
        cbWhen
          ? "Callback scheduled — we'll call at your chosen time"
          : "Callback requested — the dealer team will call you back"
      );
      setCbPhone("");
      setCbWhen("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Request failed");
    } finally {
      setCbBusy(false);
    }
  };

  const [rsWhen, setRsWhen] = useState("");
  const [rsBusy, setRsBusy] = useState(false);

  const reschedule = async () => {
    if (!rsWhen) {
      toast.error("Pick a new time");
      return;
    }
    setRsBusy(true);
    try {
      await api.post(`/incidents/${incident.id}/reschedule`, {
        scheduled_at: new Date(rsWhen).toISOString(),
      });
      toast.success("Appointment rescheduled");
      setRsWhen("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Reschedule failed");
    } finally {
      setRsBusy(false);
    }
  };

  if (!incident) return null;

  return (
    <Dialog open={!!incident} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0c111d] text-white sm:max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] pr-8">
            <button
              type="button"
              data-testid="detail-back-top-btn"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/15 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Incidents</span>
            </button>
            <span className="font-mono text-xs font-semibold text-neutral-400 tracking-wider">
              {incident.id}
            </span>
          </div>
          <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-tight text-white mt-1">
            {incident.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 font-light">
            Verified Incident Timeline &amp; Live Workshop Telematics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} testid="detail-status" />
            <PriorityBadge priority={incident.priority} testid="detail-priority" />
            <span className="rounded bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
              {incident.category} · Sev {incident.severity}/5
            </span>
          </div>

          <div className="rounded-xl bg-[#141720] border border-white/[0.06] p-4 text-xs space-y-1.5 font-light">
            <p className="text-neutral-400">
              <strong className="text-white font-medium">Model:</strong> {incident.vehicle_model}
              {incident.vehicle_vin ? ` (${incident.vehicle_vin})` : ""}
            </p>
            <p className="text-neutral-300 leading-relaxed">{incident.description}</p>
          </div>

          {incident.photo_paths?.length > 0 && (
            <img
              data-testid="detail-photo"
              src={`${API}/files/${incident.photo_paths[0]}`}
              alt="Damage photo"
              className="max-h-52 w-full rounded-xl border border-white/10 object-cover"
            />
          )}

          {incident.recommended_action && (
            <div className="rounded-xl border border-white/[0.08] bg-[#141720]/80 p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />
                  AI Diagnostic Directive
                </p>
                {incident.is_solvable !== undefined && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider ${
                      incident.is_solvable
                        ? "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30"
                        : "bg-[#e60012]/15 text-[#e60012] border border-[#e60012]/30"
                    }`}
                  >
                    {incident.is_solvable ? "SOLVABLE · DIY RESOLUTION" : "DEALER INTAKE REQUIRED"}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-200 font-light whitespace-pre-line leading-relaxed">
                {incident.recommended_action}
              </p>
            </div>
          )}

          {incident.assignee_name && (
            <p className="font-mono text-xs text-neutral-300">
              Assigned Specialist: <span className="text-white font-semibold">{incident.assignee_name}</span>
            </p>
          )}

          {/* Service Update (RSA, Remote, Slot) */}
          {incident.resolution_path && (
            <div
              data-testid="customer-service-update"
              className="rounded-xl border border-white/10 bg-[#141720] p-4"
            >
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                Operational Dispatch Update
              </p>
              {incident.resolution_path === "rsa" && (
                <RsaTracker incidentId={incident.id} />
              )}
              {incident.resolution_path === "remote" && (
                <p className="text-xs text-neutral-300 font-light">
                  Technician is executing remote diagnostics. You will receive an update shortly.
                </p>
              )}
              {incident.resolution_path === "slot" && incident.appointment && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-300 font-light">
                    Workshop bay appointment reserved for{" "}
                    <strong className="text-white font-medium">
                      {new Date(incident.appointment.slot_start).toLocaleString()}
                    </strong>{" "}
                    with {incident.appointment.technician_name}.
                    {incident.appointment.position
                      ? ` Position #${incident.appointment.position} in bay queue.`
                      : ""}
                  </p>
                  <div className="flex gap-2">
                    <input
                      data-testid="reschedule-time-input"
                      type="datetime-local"
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)}
                      value={rsWhen}
                      onChange={(e) => setRsWhen(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      data-testid="reschedule-btn"
                      onClick={reschedule}
                      disabled={rsBusy}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-heading text-xs font-bold uppercase tracking-wider shrink-0 hover:bg-neutral-200 transition-colors"
                    >
                      {rsBusy ? "…" : "Reschedule"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Timeline */}
          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-3 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Verified Progress Timeline
            </p>
            <IncidentTimeline incident={incident} />
          </div>

          {/* Request Callback */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141720]/60 p-4 space-y-2">
            <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Direct Workshop Callback
            </p>
            <div className="flex gap-2">
              <Input
                data-testid="callback-phone-input"
                value={cbPhone}
                onChange={(e) => setCbPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-black/40 border-white/10 text-white rounded-lg text-xs"
              />
              <button
                data-testid="request-callback-btn"
                onClick={requestCallback}
                disabled={cbBusy}
                className="px-4 py-1.5 rounded-lg bg-white text-black font-heading text-xs font-bold uppercase tracking-wider shrink-0 hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="h-3 w-3" />
                <span>{cbBusy ? "Sending…" : "Call Me"}</span>
              </button>
            </div>
            <input
              data-testid="callback-time-input"
              type="datetime-local"
              value={cbWhen}
              onChange={(e) => setCbWhen(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Chat Thread */}
          <ChatThread incidentId={incident.id} role="customer" />

          <div className="pt-4 border-t border-white/[0.08] flex justify-end">
            <Button
              type="button"
              data-testid="detail-back-bottom-btn"
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/[0.04] text-white hover:bg-white/10 text-xs font-heading font-semibold uppercase tracking-wider px-6 py-2.5 cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Close &amp; Return to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
