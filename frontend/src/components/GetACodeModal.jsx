import React, { useState } from "react";
import { X, Send, CheckCircle2, Loader2, Mail, Phone, User, HelpCircle, MessageSquare } from "lucide-react";
import { api } from "@/lib/apiClient";

export default function GetACodeModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Pricing & Quote",
    description: "",
    preferred_contact: "email",
    honeypot: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.description.trim()) {
      setError("Please provide your name, email address, and inquiry description.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/get-a-code", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        preferred_contact: formData.preferred_contact,
        honeypot: formData.honeypot,
      });

      if (res.data?.ok) {
        setSuccess(
          res.data.message ||
            "Your quote request has been received! A confirmation email has been sent to your email from AutoCare Pulse."
        );
      } else {
        setError(res.data?.detail || "Could not submit quote request. Please try again.");
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
      subject: "Pricing & Quote",
      description: "",
      preferred_contact: "email",
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
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-white">
              Get a Quote
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Request commercial pricing, workshop bay integration, or submit an operational inquiry.
            </p>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="mt-6 p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 size={18} />
              <span>Quote Request Dispatched</span>
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
                  placeholder="e.g. Priyanshu Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} className="text-neutral-400" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="priyanshu@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={12} className="text-neutral-400" />
                  <span>Phone Number (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 91234 56789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-neutral-400" />
                  <span>Inquiry Subject</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#e60012] transition-colors"
                >
                  <option value="Pricing & Quote">Commercial Pricing &amp; Quote</option>
                  <option value="Fleet Integration">Fleet Telematics Integration</option>
                  <option value="Workshop Partnership">Dealership &amp; Workshop Bay Queueing</option>
                  <option value="Technical Question">Technical / Diagnostic Question</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle size={12} className="text-neutral-400" />
                <span>Requirements / Notes *</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mention vehicle volume, workshop locations, or specific features needed..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090e] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#e60012] transition-colors leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Preferred Mode of Contact
              </label>
              <div className="flex gap-4 text-xs text-neutral-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferred_contact"
                    value="email"
                    checked={formData.preferred_contact === "email"}
                    onChange={(e) => setFormData({ ...formData, preferred_contact: e.target.value })}
                    className="accent-[#e60012]"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferred_contact"
                    value="phone"
                    checked={formData.preferred_contact === "phone"}
                    onChange={(e) => setFormData({ ...formData, preferred_contact: e.target.value })}
                    className="accent-[#e60012]"
                  />
                  <span>Phone Call</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferred_contact"
                    value="whatsapp"
                    checked={formData.preferred_contact === "whatsapp"}
                    onChange={(e) => setFormData({ ...formData, preferred_contact: e.target.value })}
                    className="accent-[#e60012]"
                  />
                  <span>WhatsApp</span>
                </label>
              </div>
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
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Get a Quote</span>
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
