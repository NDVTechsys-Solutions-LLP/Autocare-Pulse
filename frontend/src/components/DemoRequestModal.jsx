import React, { useState } from "react";
import { X, Calendar, Send, CheckCircle2, Loader2, Building, Mail, Phone, User, FileText } from "lucide-react";
import { api } from "@/lib/apiClient";

export default function DemoRequestModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    description: "",
    preferred_date: "",
    honeypot: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Please provide your name, email, and phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/demo-request", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        organization: formData.organization.trim(),
        description: formData.description.trim(),
        preferred_date: formData.preferred_date,
        honeypot: formData.honeypot,
      });

      if (res.data?.ok) {
        setSuccess(
          res.data.message ||
            "Demo request received! A confirmation email has been sent to your email from AutoCare Pulse."
        );
      } else {
        setError(res.data?.detail || "Could not submit demo request. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Network connection issue. Please retry or contact support.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setError("");
    setSuccess(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      organization: "",
      description: "",
      preferred_date: "",
      honeypot: "",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-xl my-8 rounded-2xl bg-[#0c111d] border border-white/10 p-6 sm:p-8 shadow-2xl text-left text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-white">
              Request a Demo
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live walkthrough of OBD-II telematics, incident intake, and workshop queueing.
            </p>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="mt-6 p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 size={18} />
              <span>Demo Request Dispatched</span>
            </div>
            <p>{success}</p>
            <p className="text-[11px] text-emerald-300/80">
              Confirmation sent directly from: <strong className="text-white">AutoCare Pulse</strong>
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Honeypot field */}
            <input
              type="text"
              name="hp_field"
              value={formData.honeypot}
              onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={12} className="text-neutral-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} className="text-neutral-400" />
                  <span>Work Email *</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@dealership.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={12} className="text-neutral-400" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building size={12} className="text-neutral-400" />
                  <span>Organization / Dealership</span>
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Apex Motors Workshop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={12} className="text-neutral-400" />
                <span>Preferred Demo Date</span>
              </label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#e60012] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={12} className="text-neutral-400" />
                <span>Operational Requirements / Notes</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mention specific workflows you want covered (e.g. roadside assistance dispatch, telemetry intake, technician bay scheduling)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium bg-red-950/30 p-2.5 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/10">
              <span className="text-[11px] text-neutral-400 font-mono">
                Official sender: <span className="text-[#00F0FF]">AutoCare Pulse</span>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d8e6] text-[#090a0d] font-heading font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#00F0FF]/25 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Request Demo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
