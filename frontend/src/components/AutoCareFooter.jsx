import React from "react";
import {
  Activity,
  Car,
  Wrench,
  Mail,
  PhoneCall,
  Phone,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
} from "lucide-react";

export default function AutoCareFooter({
  onOpenDemo,
  onOpenGetCode,
  onDealerLogin,
  onDriverLogin,
  onOpenLegal,
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#07090e] border-t border-white/10 pt-14 pb-12 text-xs text-neutral-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Top Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Left Brand Column (Cols 1-5) */}
          <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8">
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="cursor-pointer flex items-center gap-3 select-none hover:opacity-90 transition-opacity"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#e60012] shrink-0">
                <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-heading font-black text-xl tracking-tight text-white uppercase">
                AUTOCARE<span className="text-[#00F0FF]">PULSE</span>
              </span>
            </div>

            <p className="mt-4 text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-md">
              Connected vehicle telematics and intelligent breakdown triage network. Multimodal photo and voice damage analysis, real-time emergency roadside assistance dispatch, and priority service center bay allocation for drivers and authorized workshops.
            </p>

            {/* Direct Portal Quick Links */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onDriverLogin}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Car size={14} className="text-neutral-400" />
                <span>Driver Portal</span>
              </button>
              <button
                type="button"
                onClick={onDealerLogin}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Wrench size={14} className="text-[#e60012]" />
                <span>Dealer Console</span>
              </button>
            </div>
          </div>

          {/* Right Nav Columns (Cols 6-12, 4 focused columns) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-6">
            {/* Column 1: PLATFORM */}
            <div>
              <h3 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3.5">
                PLATFORM
              </h3>
              <ul className="space-y-2.5 text-neutral-400 text-xs font-normal">
                <li>
                  <button
                    onClick={() => scrollTo("section-03")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    AI Photo Triage
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-04")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Roadside Dispatch
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-05")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Workshop Bay Queue
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-04")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Priority VIP Tier
                  </button>
                </li>
                <li>
                  <a
                    href="https://tripshield.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1 text-neutral-300"
                  >
                    TripShield
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: ACTIONS */}
            <div>
              <h3 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3.5">
                ACTIONS
              </h3>
              <ul className="space-y-2.5 text-neutral-400 text-xs font-normal">
                <li>
                  <button
                    onClick={onOpenDemo}
                    className="text-[#e60012] hover:text-red-400 font-semibold transition-colors cursor-pointer text-left inline-flex items-center gap-1"
                  >
                    Request Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenGetQuote || onOpenGetCode}
                    className="text-neutral-200 hover:text-white font-semibold transition-colors cursor-pointer text-left inline-flex items-center gap-1"
                  >
                    Get a Quote
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-03")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={onDealerLogin}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Dealer Login
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: CONTACT */}
            <div>
              <h3 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3.5">
                CONTACT
              </h3>
              <ul className="space-y-2.5 text-neutral-400 text-xs font-normal">
                <li>
                  <a
                    href="mailto:customer@ndvTexas.com"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 break-all text-neutral-300"
                  >
                    <Mail size={12} className="shrink-0 text-neutral-400" />
                    <span>customer@ndvTexas.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919538880910"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <PhoneCall size={12} className="shrink-0 text-neutral-400" />
                    <span>+91 95388 80910</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/919538880910?text=Hello%20AutoCare%20Pulse%20Team%2C%20I%20have%20an%20inquiry%20regarding%20AutoCare%20Pulse."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 text-emerald-400"
                  >
                    <Phone size={12} className="shrink-0 text-emerald-400" />
                    <span>Emergency WhatsApp</span>
                  </a>
                </li>
                <li className="pt-1 text-[11px] text-neutral-500">
                  <span>Hyderabad &bull; Bangalore &bull; Pune</span>
                </li>
              </ul>
            </div>

            {/* Column 4: LEGAL */}
            <div>
              <h3 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3.5">
                LEGAL
              </h3>
              <ul className="space-y-2.5 text-neutral-400 text-xs font-normal">
                <li>
                  <button
                    onClick={() => onOpenLegal && onOpenLegal("privacy")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal && onOpenLegal("terms")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal && onOpenLegal("privacy")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Data Protection
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal && onOpenLegal("terms")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    SLA Guarantee
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recognised By Badges Row (Matches TripShield Reference Architecture) */}
        <div className="py-8 border-t border-b border-white/10">
          <p className="text-center text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-[0.2em] text-neutral-400 mb-5">
            RECOGNISED BY
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
            {/* Badge 1: MCA */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[9px] font-bold text-white font-mono">
                GOI
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-400 uppercase leading-none font-medium">
                  Govt. of India
                </p>
                <p className="text-[11px] text-white font-semibold leading-tight mt-0.5">
                  Ministry of Corporate Affairs
                </p>
              </div>
            </div>

            {/* Badge 2: T-Hub */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-6 h-6 rounded-md bg-[#e60012]/15 border border-[#e60012]/30 flex items-center justify-center text-[10px] font-black text-[#e60012]">
                TH
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-400 uppercase leading-none font-medium">
                  Incubated At
                </p>
                <p className="text-[11px] text-white font-semibold leading-tight mt-0.5">
                  T-Hub Hyderabad
                </p>
              </div>
            </div>

            {/* Badge 3: Startup India */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                🇮🇳
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-400 uppercase leading-none font-medium">
                  Recognised By
                </p>
                <p className="text-[11px] text-white font-semibold leading-tight mt-0.5">
                  Startup India &bull; DPIIT
                </p>
              </div>
            </div>

            {/* Badge 4: 112 ERSS */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-6 h-6 rounded-md bg-[#e60012]/15 border border-[#e60012]/30 flex items-center justify-center text-[9px] font-bold text-[#e60012]">
                112
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-400 uppercase leading-none font-medium">
                  Emergency Integration
                </p>
                <p className="text-[11px] text-white font-semibold leading-tight mt-0.5">
                  112 ERSS Aligned
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Social Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>
              &copy; {new Date().getFullYear()} AutoCare Pulse by NDV TECHSYS SOLUTIONS LLP.
            </span>
            <span className="hidden sm:inline text-neutral-600">&bull;</span>
            <span className="text-neutral-400">All rights reserved.</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              <Linkedin size={15} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              <Instagram size={15} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              <Facebook size={15} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              <Youtube size={15} />
            </a>
            <a
              href="https://wa.me/919538880910?text=Hello%20AutoCare%20Pulse%20Team%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors shadow-sm"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
