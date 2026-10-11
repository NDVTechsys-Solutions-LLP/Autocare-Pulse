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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#090a0d]/90 px-6 py-4 backdrop-blur-md md:px-10">
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
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-neutral-300 sm:inline tracking-wide">{dealer.name}</span>
          <Button data-testid="dealer-logout-btn" onClick={logout} variant="ghost" size="icon" className="p-2 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        {kpis && <KpiBar kpis={kpis} />}

        <Tabs defaultValue="queue" className="mt-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger data-testid="tab-queue" value="queue">Incident Queue</TabsTrigger>
            <TabsTrigger data-testid="tab-kpi" value="kpi">KPI & Escalation</TabsTrigger>
            <TabsTrigger data-testid="tab-connect" value="connect">Amazon Connect</TabsTrigger>
          </TabsList>

          {/* QUEUE */}
          <TabsContent value="queue" className="mt-4 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold uppercase tracking-tight">Orchestration Queue</h2>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger data-testid="priority-filter" className="w-40 bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ac-scroll grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
                {filtered.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center font-mono text-sm text-muted-foreground">No incidents in queue.</p>}
                {filtered.map((inc, i) => (
                  <motion.button key={inc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    data-testid={`queue-card-${inc.id}`} onClick={() => setSelected(inc)}
                    className={`rounded-xl border bg-card p-4 text-left transition-colors duration-200 hover:border-accent/50 ${inc.sla_breached ? "border-red-500/50 shadow-[0_0_20px_rgba(255,42,75,0.12)]" : "border-border"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{inc.id}</span>
                        <PriorityBadge priority={inc.priority} testid={`q-priority-${inc.id}`} />
                        {inc.escalation_level > 0 && <span className="rounded-md bg-red-500/15 px-2 py-0.5 font-mono text-[10px] uppercase text-red-400">L{inc.escalation_level} escalated</span>}
                      </div>
                      <StatusBadge status={inc.status} testid={`q-status-${inc.id}`} />
                    </div>
                    <h3 className="mt-2 font-heading text-lg font-semibold">{inc.title}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{inc.customer_name} · {inc.vehicle_model} · {inc.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`flex items-center gap-1 font-mono text-[11px] ${inc.sla_breached ? "text-red-400" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" />
                        {inc.sla_breached ? "SLA BREACHED" : inc.status === "resolved" ? "Resolved" : `${Math.max(inc.sla_remaining_min, 0)} min to SLA`}
                      </span>
                      <span className="flex items-center font-mono text-[11px] text-accent">{inc.assignee_name || "Unassigned"} <ChevronRight className="h-3 w-3" /></span>
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
          <TabsContent value="kpi" className="mt-4 space-y-5">
            <ConnectMetricsPanel />
            {kpis && <KpiCharts kpis={kpis} incidents={incidents} />}
          </TabsContent>

          {/* CONNECT */}
          <TabsContent value="connect" className="mt-4 grid gap-5 lg:grid-cols-2">
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
  const COLORS = { High: "#FF2A4B", Medium: "#FF9F1C", Low: "#10B981" };
  const breached = incidents.filter((i) => i.sla_breached);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-xl font-semibold">Incidents by Category</h3>
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
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-xl font-semibold">Priority Mix</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={prioData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
              {prioData.map((d, i) => <Cell key={i} fill={COLORS[d.name]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4">
          {prioData.map((d) => <span key={d.name} className="flex items-center gap-1.5 font-mono text-xs"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.name] }} />{d.name} ({d.value})</span>)}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-xl font-semibold">Escalation Path & SLA Breaches</h3>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["Dealer Service Manager", "OEM Regional Lead", "OEM Quality Head"].map((lvl, i) => (
            <React.Fragment key={lvl}>
              <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 font-mono text-xs uppercase tracking-wider">L{i + 1} · {lvl}</span>
              {i < 2 && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
        {breached.length === 0 ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-400">All incidents within SLA. No escalations required.</p>
        ) : (
          <div className="space-y-2">
            {breached.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <span className="text-sm"><span className="font-mono text-red-400">{b.id}</span> — {b.title} ({b.customer_name})</span>
                <span className="font-mono text-xs text-red-400">Breached · L{b.escalation_level}</span>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight">{incident.id}</DialogTitle>
          <DialogDescription>Assign a technician, update status, escalate or resolve this incident.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} testid="dealer-detail-status" />
            <PriorityBadge priority={incident.priority} testid="dealer-detail-priority" />
            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase text-muted-foreground">{incident.category} · Sev {incident.severity}/5</span>
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">{incident.title}</h3>
            <p className="text-sm text-muted-foreground">{incident.customer_name} · {incident.customer_email}</p>
            <p className="text-sm text-muted-foreground">{incident.vehicle_model}{incident.vehicle_vin ? ` · ${incident.vehicle_vin}` : ""}</p>
          </div>
          <p className="text-sm">{incident.description}</p>
          {incident.photo_paths?.length > 0 && <img src={`${API}/files/${incident.photo_paths[0]}`} alt="issue" className="max-h-48 w-full rounded-lg border border-border object-cover" />}
          {incident.recommended_action && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent">AI Recommendation</p>
              <p className="mt-1 text-sm">{incident.recommended_action}</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Resolution Path · {incident.priority} priority</p>
            {incident.appointment && (
              <div className="mb-2 rounded-lg border border-accent/30 bg-accent/5 p-2.5 text-sm">
                <p className="flex items-center gap-1.5 font-semibold"><CalendarClock className="h-4 w-4 text-accent" />Service slot booked</p>
                <p className="text-muted-foreground">{new Date(incident.appointment.slot_start).toLocaleString()} · {incident.appointment.technician_name} · queue #{incident.appointment.position} of {incident.appointment.lanes_total} bays</p>
              </div>
            )}
            {incident.rsa && <p className="mb-2 text-sm text-emerald-400">RSA dispatched · {incident.rsa.unit} · ETA {incident.rsa.eta_min}m</p>}
            {incident.priority === "High" ? (
              <Button data-testid="dispatch-rsa-btn" onClick={() => onDispatch(incident.id, { mode: "rsa", eta_min: 45 })} className="w-full rounded-full bg-red-600 font-bold hover:bg-red-500"><Truck className="mr-1.5 h-4 w-4" />Dispatch Roadside Assistance</Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button data-testid="try-remote-btn" onClick={() => onDispatch(incident.id, { mode: "remote" })} variant="outline" className="rounded-full border-border"><MonitorSmartphone className="mr-1.5 h-4 w-4" />Try Remote Fix</Button>
                <Button data-testid="book-slot-btn" onClick={() => onDispatch(incident.id, { mode: "slot", remote_failed: incident.resolution_path === "remote" })} className="rounded-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"><CalendarClock className="mr-1.5 h-4 w-4" />{incident.resolution_path === "remote" ? "Remote Failed → Slot" : "Book Service Slot"}</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Assign Technician</label>
              <Select value={incident.assignee_id || ""} onValueChange={(v) => onUpdate(incident.id, { assignee_id: v })}>
                <SelectTrigger data-testid="assign-tech-select" className="bg-secondary/50"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{team.map((t) => <SelectItem key={t.dealer_id} value={t.dealer_id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={incident.status} onValueChange={(v) => onUpdate(incident.id, { status: v })}>
                <SelectTrigger data-testid="status-select" className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button data-testid="chat-btn" onClick={() => onChat(incident.id, incident.customer_name)} variant="outline" className="flex-1 rounded-full border-accent/40 text-accent hover:bg-accent/10">
              <MessageSquare className="mr-1.5 h-4 w-4" /> Start Chat / SMS
            </Button>
          </div>

          <div className="flex gap-2">
            <Button data-testid="escalate-btn" onClick={() => onEscalate(incident.id)} variant="outline" className="flex-1 rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10">
              <ArrowUpRight className="mr-1.5 h-4 w-4" /> Escalate {incident.escalation_level > 0 ? `(L${incident.escalation_level})` : ""}
            </Button>
            {incident.status !== "resolved" && (
              <Button data-testid="resolve-btn" onClick={() => onUpdate(incident.id, { status: "resolved", note: "Marked resolved by dealer" })} className="flex-1 rounded-full bg-emerald-600 font-bold hover:bg-emerald-500">
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
