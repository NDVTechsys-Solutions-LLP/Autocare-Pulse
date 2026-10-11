import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, LogOut, ArrowUpRight, Clock, ChevronRight, TrendingUp, MessageSquare, Truck, MonitorSmartphone, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { toast } from "sonner";
import { api, dealerCfg, API } from "@/lib/apiClient";
import { StatusBadge, PriorityBadge } from "@/components/app/Badges";
import KpiBar from "@/components/app/KpiBar";
import ConnectCCP from "@/components/app/ConnectCCP";
import CCPSoftphone from "@/components/app/CCPSoftphone";
import ConnectMetricsPanel from "@/components/app/ConnectMetricsPanel";
import ChatThread from "@/components/app/ChatThread";
import RecordingList from "@/components/app/RecordingList";
import CallbacksPanel from "@/components/app/CallbacksPanel";

const STATUSES = ["ai_triaged", "assigned", "in_progress", "resolved"];
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

export default function DealerConsole() {
  const navigate = useNavigate();
  const dealer = JSON.parse(localStorage.getItem("dealer_info") || "{}");
  const [incidents, setIncidents] = useState([]);
  const [team, setTeam] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [connect, setConnect] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [inc, tm, kp, cn] = await Promise.all([
        api.get("/dealer/incidents", dealerCfg()),
        api.get("/dealer/team", dealerCfg()),
        api.get("/dealer/kpis", dealerCfg()),
        api.get("/dealer/connect/status", dealerCfg()),
      ]);
      setIncidents(inc.data); setTeam(tm.data); setKpis(kp.data); setConnect(cn.data);
      if (selected) setSelected(inc.data.find((i) => i.id === selected.id) || null);
    } catch (e) {
      if (e.response?.status === 401) { localStorage.removeItem("dealer_token"); navigate("/"); }
    }
  }, [navigate, selected]);

  useEffect(() => { load(); const t = setInterval(load, 7000); return () => clearInterval(t); }, []); // eslint-disable-line

  const logout = () => { localStorage.removeItem("dealer_token"); localStorage.removeItem("dealer_info"); navigate("/"); };

  const filtered = incidents
    .filter((i) => filter === "all" || i.priority === filter)
    .sort((a, b) => (a.status === "resolved") - (b.status === "resolved") || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const update = async (id, payload) => {
    try { await api.patch(`/dealer/incidents/${id}`, payload, dealerCfg()); toast.success("Incident updated"); load(); }
    catch { toast.error("Update failed"); }
  };
  const escalate = async (id) => {
    try { const r = await api.post(`/dealer/incidents/${id}/escalate`, {}, dealerCfg()); toast.success(`Escalated to Level ${r.data.escalation_level}`); load(); }
    catch { toast.error("Escalation failed"); }
  };
  const startChat = async (id, name) => {
    try { const r = await api.post(`/dealer/connect/chat`, { incident_id: id, display_name: name || "Customer" }, dealerCfg()); toast.success(`Chat/SMS opened · ${r.data.contact_id}`); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Chat failed"); }
  };
  const dispatchAction = async (id, body) => {
    try { await api.post(`/dealer/incidents/${id}/dispatch`, body, dealerCfg()); toast.success(body.mode === "rsa" ? "Roadside Assistance dispatched" : body.mode === "remote" ? "Remote resolution started" : "Service slot booked & customer notified"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Action failed"); }
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] font-body selection:bg-white/20 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#090a0d]/90 px-6 py-5 backdrop-blur-md md:px-12">
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-3 select-none hover:opacity-90 transition-opacity"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#E63946] shadow-[0_0_15px_rgba(230,57,70,0.45)] shrink-0">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-lg tracking-tight text-white uppercase">
              AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
            </span>
          </div>
          <span className="h-4 w-px bg-white/10 hidden sm:block" />
          {dealer.dealership_name && (
            <span
              data-testid="dealer-dealership-name"
              className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-white"
            >
              {dealer.dealership_name}
            </span>
          )}
          <span className="hidden font-heading text-xs font-semibold tracking-[0.2em] uppercase text-neutral-400 sm:inline">
            WORKSHOP OPS CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-medium text-neutral-300 md:inline tracking-wide">{dealer.name}</span>
          <button
            data-testid="dealer-logout-btn"
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-6 py-10 md:px-12">
        {/* Top Control Bar */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end pb-8 border-b border-white/[0.06] mb-8">
          <div>
            <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-1">
              WORKSHOP TELEMATICS
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              DEALER OPERATIONS
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 font-light">
              Real-time incident orchestration, multi-bay assignment &amp; Amazon Connect integration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">Priority:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger data-testid="priority-filter" className="w-44 bg-[#141720] border-white/10 text-white rounded-xl text-xs font-heading font-semibold uppercase tracking-wider h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0e1015] border border-white/10 text-white rounded-xl">
                <SelectItem value="all" className="text-xs font-heading uppercase tracking-wider text-neutral-300 focus:bg-white/10 focus:text-white cursor-pointer">All Priorities</SelectItem>
                <SelectItem value="High" className="text-xs font-heading uppercase tracking-wider text-[#E63946] focus:bg-white/10 focus:text-[#E63946] cursor-pointer">High Priority</SelectItem>
                <SelectItem value="Medium" className="text-xs font-heading uppercase tracking-wider text-amber-400 focus:bg-white/10 focus:text-amber-400 cursor-pointer">Medium Priority</SelectItem>
                <SelectItem value="Low" className="text-xs font-heading uppercase tracking-wider text-emerald-400 focus:bg-white/10 focus:text-emerald-400 cursor-pointer">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {kpis && <KpiBar kpis={kpis} />}

        <Tabs defaultValue="queue" className="mt-8">
          <TabsList className="bg-[#141720] border border-white/10 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger
              data-testid="tab-queue"
              value="queue"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-bold uppercase tracking-wider py-2 px-4 transition-all"
            >
              Incident Queue ({filtered.length})
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-kpi"
              value="kpi"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-bold uppercase tracking-wider py-2 px-4 transition-all"
            >
              KPI &amp; Escalation
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-connect"
              value="connect"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg text-xs font-heading font-bold uppercase tracking-wider py-2 px-4 transition-all"
            >
              Amazon Connect
            </TabsTrigger>
          </TabsList>

          {/* QUEUE */}
          <TabsContent value="queue" className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                  Active Orchestration Queue
                </h2>
                <span className="font-mono text-xs text-neutral-500">
                  Auto-syncs every 7s
                </span>
              </div>
              <div className="ac-scroll grid max-h-[75vh] gap-3.5 overflow-y-auto pr-1">
                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#0e1015]/40 p-12 text-center font-mono text-xs text-neutral-500">
                    No incidents matching current priority filter.
                  </div>
                )}
                {filtered.map((inc, i) => (
                  <motion.button
                    key={inc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    data-testid={`queue-card-${inc.id}`}
                    onClick={() => setSelected(inc)}
                    className={`group rounded-2xl bg-[#0e1015] border p-5 text-left transition-all duration-300 flex flex-col justify-between ${
                      inc.sla_breached
                        ? "border-[#E63946]/60 shadow-[0_0_20px_rgba(230,57,70,0.18)]"
                        : "border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-neutral-400 tracking-wider">
                          {inc.id}
                        </span>
                        <PriorityBadge priority={inc.priority} testid={`q-priority-${inc.id}`} />
                        {inc.escalation_level > 0 && (
                          <span className="rounded bg-[#E63946]/15 border border-[#E63946]/30 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-[#E63946]">
                            L{inc.escalation_level} escalated
                          </span>
                        )}
                        <span className="rounded bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                          {inc.category}
                        </span>
                      </div>
                      <StatusBadge status={inc.status} testid={`q-status-${inc.id}`} />
                    </div>

                    <div className="mt-3">
                      <h3 className="font-heading text-lg font-bold text-white group-hover:text-neutral-200 transition-colors">
                        {inc.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-neutral-400 font-light">
                        <span className="text-white font-medium">{inc.customer_name}</span> · {inc.vehicle_model}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`flex items-center gap-1.5 font-mono text-[11px] font-medium ${
                          inc.sla_breached ? "text-[#E63946]" : "text-neutral-400"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {inc.sla_breached
                          ? "SLA BREACHED"
                          : inc.status === "resolved"
                          ? "Resolved"
                          : `${Math.max(inc.sla_remaining_min, 0)} min to SLA`}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#00F0FF] group-hover:translate-x-1 transition-transform">
                        {inc.assignee_name || "Unassigned"} <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              {connect && <ConnectCCP status={connect} onCall={load} />}
            </div>
          </TabsContent>

          {/* KPI */}
          <TabsContent value="kpi" className="mt-6 space-y-6">
            <ConnectMetricsPanel />
            {kpis && <KpiCharts kpis={kpis} incidents={incidents} />}
          </TabsContent>

          {/* CONNECT */}
          <TabsContent value="connect" className="mt-6 grid gap-6 lg:grid-cols-2">
            {connect && <ConnectCCP status={connect} onCall={load} />}
            <CCPSoftphone ccpUrl={connect?.ccp_url} />
            <div className="lg:col-span-2"><CallbacksPanel /></div>
          </TabsContent>
        </Tabs>
      </main>

      <DealerDetail incident={selected} team={team} onClose={() => setSelected(null)} onUpdate={update} onEscalate={escalate} onChat={startChat} onDispatch={dispatchAction} />
    </div>
  );
}

function KpiCharts({ kpis, incidents }) {
  const catData = Object.entries(kpis.by_category).map(([name, value]) => ({ name, value }));
  const prioData = Object.entries(kpis.by_priority).map(([name, value]) => ({ name, value }));
  const COLORS = { High: "#E63946", Medium: "#FF9F1C", Low: "#10B981" };
  const breached = incidents.filter((i) => i.sla_breached);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Incidents by Category</h3>
          <span className="font-mono text-[10px] uppercase text-neutral-400">Telemetry Breakdown</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={catData}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {catData.map((_, i) => <Cell key={i} fill="#00F0FF" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Priority Mix</h3>
          <span className="font-mono text-[10px] uppercase text-neutral-400">Severity Distribution</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={prioData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
              {prioData.map((d, i) => <Cell key={i} fill={COLORS[d.name]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {prioData.map((d) => (
            <span key={d.name} className="flex items-center gap-1.5 font-mono text-xs text-neutral-300">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.name] }} />
              {d.name} ({d.value})
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 lg:col-span-2 hover:border-white/15 transition-all">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00F0FF]" />
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Escalation Path &amp; SLA Breaches</h3>
          </div>
          <span className="font-mono text-xs text-neutral-400">Automated Protocol</span>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {["Dealer Service Manager", "OEM Regional Lead", "OEM Quality Head"].map((lvl, i) => (
            <React.Fragment key={lvl}>
              <span className="rounded-full border border-white/10 bg-[#141720] px-3.5 py-1 font-mono text-xs uppercase tracking-wider text-white">
                L{i + 1} · {lvl}
              </span>
              {i < 2 && <ArrowUpRight className="h-4 w-4 text-neutral-500" />}
            </React.Fragment>
          ))}
        </div>
        {breached.length === 0 ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-400">
            All incidents within SLA. No active escalations required.
          </p>
        ) : (
          <div className="space-y-2">
            {breached.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#E63946]/30 bg-[#E63946]/10 p-3.5">
                <span className="text-xs text-neutral-200">
                  <span className="font-mono text-[#E63946] font-bold mr-2">{b.id}</span>
                  {b.title} ({b.customer_name})
                </span>
                <span className="font-mono text-xs text-[#E63946] font-bold">Breached · Level {b.escalation_level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DealerDetail({ incident, team, onClose, onUpdate, onEscalate, onChat, onDispatch }) {
  if (!incident) return null;
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0e1015] text-white sm:max-w-xl p-8 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-neutral-400 tracking-wider">
              {incident.id}
            </span>
          </div>
          <DialogTitle className="font-heading text-2xl font-black uppercase tracking-tight text-white mt-1">
            {incident.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 font-light">
            Assign specialist, update workshop bay status, execute roadside dispatch or escalate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} testid="dealer-detail-status" />
            <PriorityBadge priority={incident.priority} testid="dealer-detail-priority" />
            <span className="rounded bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
              {incident.category} · Sev {incident.severity}/5
            </span>
          </div>

          <div className="rounded-xl bg-[#141720] border border-white/[0.06] p-4 text-xs space-y-1.5 font-light">
            <p className="text-neutral-400">
              <strong className="text-white font-medium">Customer:</strong> {incident.customer_name} ({incident.customer_email})
            </p>
            <p className="text-neutral-400">
              <strong className="text-white font-medium">Vehicle:</strong> {incident.vehicle_model}{incident.vehicle_vin ? ` · VIN: ${incident.vehicle_vin}` : ""}
            </p>
            <p className="text-neutral-300 leading-relaxed pt-1">{incident.description}</p>
          </div>

          {incident.photo_paths?.length > 0 && (
            <img
              src={`${API}/files/${incident.photo_paths[0]}`}
              alt="Damage intake"
              className="max-h-52 w-full rounded-xl border border-white/10 object-cover"
            />
          )}

          {incident.recommended_action && (
            <div className="rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/5 p-4">
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">
                AI Diagnostic Directive
              </p>
              <p className="mt-1 text-xs text-neutral-200 font-light leading-relaxed whitespace-pre-line">
                {incident.recommended_action}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.08] bg-[#141720] p-4">
            <p className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Resolution Path · {incident.priority} priority
            </p>
            {incident.appointment && (
              <div className="mb-3 rounded-lg border border-[#00F0FF]/30 bg-[#00F0FF]/5 p-3 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-white">
                  <CalendarClock className="h-4 w-4 text-[#00F0FF]" />
                  Service slot reserved
                </p>
                <p className="text-neutral-400 mt-0.5">
                  {new Date(incident.appointment.slot_start).toLocaleString()} · {incident.appointment.technician_name} · Bay Queue #{incident.appointment.position} of {incident.appointment.lanes_total}
                </p>
              </div>
            )}
            {incident.rsa && (
              <p className="mb-3 text-xs font-mono text-emerald-400">
                RSA Unit Active · {incident.rsa.unit} · ETA {incident.rsa.eta_min} min
              </p>
            )}
            {incident.priority === "High" ? (
              <Button
                data-testid="dispatch-rsa-btn"
                onClick={() => onDispatch(incident.id, { mode: "rsa", eta_min: 45 })}
                className="w-full rounded-full bg-[#E63946] hover:bg-[#d02e3b] font-heading font-bold text-xs uppercase tracking-wider text-white py-3 shadow-[0_0_15px_rgba(230,57,70,0.3)]"
              >
                <Truck className="mr-2 h-4 w-4" />
                Dispatch Roadside Assistance
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  data-testid="try-remote-btn"
                  onClick={() => onDispatch(incident.id, { mode: "remote" })}
                  variant="outline"
                  className="rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  <MonitorSmartphone className="mr-1.5 h-3.5 w-3.5" />
                  Try Remote Fix
                </Button>
                <Button
                  data-testid="book-slot-btn"
                  onClick={() => onDispatch(incident.id, { mode: "slot", remote_failed: incident.resolution_path === "remote" })}
                  className="rounded-full bg-[#00F0FF] hover:bg-[#00d0e0] font-heading font-bold text-xs uppercase tracking-wider text-black shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                >
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                  {incident.resolution_path === "remote" ? "Remote Failed → Slot" : "Book Service Slot"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Assign Specialist
              </label>
              <Select value={incident.assignee_id || ""} onValueChange={(v) => onUpdate(incident.id, { assignee_id: v })}>
                <SelectTrigger data-testid="assign-tech-select" className="bg-[#141720] border-white/10 text-white rounded-xl text-xs font-heading uppercase tracking-wider">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-[#0e1015] border border-white/10 text-white rounded-xl">
                  {team.map((t) => (
                    <SelectItem key={t.dealer_id} value={t.dealer_id} className="text-xs font-heading uppercase tracking-wider text-neutral-300 focus:bg-white/10 focus:text-white cursor-pointer">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Workflow Status
              </label>
              <Select value={incident.status} onValueChange={(v) => onUpdate(incident.id, { status: v })}>
                <SelectTrigger data-testid="status-select" className="bg-[#141720] border-white/10 text-white rounded-xl text-xs font-heading uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0e1015] border border-white/10 text-white rounded-xl">
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-heading uppercase tracking-wider text-neutral-300 focus:bg-white/10 focus:text-white cursor-pointer">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="chat-btn"
              onClick={() => onChat(incident.id, incident.customer_name)}
              variant="outline"
              className="flex-1 rounded-full border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 text-xs font-heading font-semibold uppercase tracking-wider"
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Start Chat / SMS
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="escalate-btn"
              onClick={() => onEscalate(incident.id)}
              variant="outline"
              className="flex-1 rounded-full border border-[#E63946]/40 text-[#E63946] hover:bg-[#E63946]/10 text-xs font-heading font-semibold uppercase tracking-wider"
            >
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              Escalate {incident.escalation_level > 0 ? `(L${incident.escalation_level})` : ""}
            </Button>
            {incident.status !== "resolved" && (
              <Button
                data-testid="resolve-btn"
                onClick={() => onUpdate(incident.id, { status: "resolved", note: "Marked resolved by dealer" })}
                className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs uppercase tracking-wider"
              >
                Mark Resolved
              </Button>
            )}
          </div>

          <RecordingList incidentId={incident.id} />
          <ChatThread incidentId={incident.id} role="dealer" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
