import React from "react";
import {
  Activity,
  Car,
  Wrench,
  Mail,
  PhoneCall,
  ExternalLink,
  Linkedin,
  Youtube,
  Phone,
} from "lucide-react";

export default function AutoCareFooter({
  onOpenDemo,
  onOpenGetCode,
  onOpenGetQuote,
  onDealerLogin,
  onDriverLogin,
  onOpenLegal,
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuoteClick = onOpenGetQuote || onOpenGetCode;

  return (
    <footer className="relative bg-[#07090e] border-t border-white/10 pt-14 pb-12 font-body text-xs text-neutral-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Top Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-10">
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

            <p className="mt-4 text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-md font-light">
              Connected vehicle telematics and emergency safety network. Real-time crash detection, automated emergency dispatch, and live tracking for riders and certified workshops.
            </p>

            {/* Direct Portal Quick Links */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onDriverLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Car size={14} className="text-[#00F0FF]" />
                <span>Driver Portal</span>
              </button>
              <button
                type="button"
                onClick={onDealerLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Wrench size={14} className="text-[#e60012]" />
                <span>Service Center Portal</span>
              </button>
            </div>
          </div>

          {/* Right Nav Columns (Cols 6-12, 4 focused columns) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {/* Column 1: PLATFORM */}
            <div>
              <h3 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3.5">
                PLATFORM
              </h3>
              <ul className="space-y-2.5 text-neutral-400 text-xs font-normal">
                <li>
                  <button
                    onClick={() => scrollTo("section-01")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Live Tracking
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-02")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Crash Detection
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-03")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Family Live Link
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("section-04")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Workshop Triage
                  </button>
                </li>
                <li>
                  <a
                    href="https://tripshield.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1 text-neutral-300"
                  >
                    <span>TripShield</span>
                    <ExternalLink size={12} />
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
                    className="text-[#e60012] hover:text-red-400 font-heading font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer text-left"
                  >
                    Request Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleQuoteClick}
                    className="text-[#00F0FF] hover:text-cyan-300 font-heading font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer text-left"
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
                    onClick={() => scrollTo("section-05")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    FAQ
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
                    href="mailto:customercare@ndvtechsys.com"
                    className="hover:text-white transition-colors inline-flex items-start gap-2 break-all text-neutral-300"
                  >
                    <Mail size={13} className="shrink-0 text-[#e60012] mt-0.5" />
                    <span>customercare@ndvtechsys.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919538880910"
                    className="hover:text-white transition-colors inline-flex items-center gap-2 text-neutral-300"
                  >
                    <PhoneCall size={13} className="shrink-0 text-[#e60012]" />
                    <span>+91-9538880910</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/919538880910?text=Hello%20AutoCare%20Pulse%20Team%2C%20I%20have%20an%20inquiry%20regarding%20AutoCare%20Pulse."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-2 text-neutral-300"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                    <span>WhatsApp Desk</span>
                  </a>
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
                    Terms &amp; Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal && onOpenLegal("erss")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    112 ERSS Interop
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-white/10 my-8" />

        {/* RECOGNISED & SUPPORTED BY Section - Built with AutoCare Pulse's Theme & Typography */}
        <div className="pb-6">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-5">
            RECOGNISED &amp; SUPPORTED BY
          </p>

          <div className="flex flex-wrap items-start gap-6 sm:gap-8">
            {/* Card 1: MCA REGISTERED */}
            <div className="flex flex-col items-center">
              <div className="bg-[#0e1015] border border-white/10 hover:border-white/20 transition-all rounded-xl px-5 py-4 flex items-center justify-center gap-3 w-48 h-20 select-none">
                {/* Ashoka Pillar / Govt Emblem SVG in AutoCare Pulse Electric Cyan */}
                <svg
                  className="w-8 h-8 text-[#00F0FF] shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C9.5 2 7.5 3.8 7.5 6c0 1.2.5 2.3 1.3 3H7c-.6 0-1 .4-1 1v1h12v-1c0-.6-.4-1-1-1h-1.8c.8-.7 1.3-1.8 1.3-3 0-2.2-2-4-4.5-4zm-3 10v5h1.5v-5H9zm3.25 0v5h1.5v-5h-1.5zm3.25 0v5H17v-5h-1.5zM6 18v2h12v-2H6zm-1 3v1h14v-1H5z" />
                </svg>
                <div className="flex flex-col text-left font-heading font-black text-white text-xs uppercase tracking-wider leading-tight">
                  <span>MINISTRY OF</span>
                  <span>CORPORATE</span>
                  <span>AFFAIRS</span>
                </div>
              </div>
              <span className="font-heading text-xs font-semibold tracking-[0.2em] uppercase text-neutral-400 mt-2 text-center">
                MCA REGISTERED
              </span>
            </div>

            {/* Card 2: STARTUP INDIA */}
            <div className="flex flex-col items-center">
              <div className="bg-[#0e1015] border border-white/10 hover:border-white/20 transition-all rounded-xl px-5 py-4 flex items-center justify-center gap-3 w-48 h-20 select-none">
                {/* Startup India Indian Flag Badge in Clean Dark Container */}
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 shrink-0 flex flex-col shadow-inner">
                  <div className="h-1/3 bg-[#FF9933]" />
                  <div className="h-1/3 bg-white flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 rounded-full border border-[#000080] flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-[#000080]" />
                    </div>
                  </div>
                  <div className="h-1/3 bg-[#138808]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-heading font-black text-white text-xs uppercase tracking-wider leading-tight">
                    #STARTUPINDIA
                  </span>
                  <span className="font-body text-xs text-[#00F0FF] font-medium leading-tight mt-0.5">
                    DPIIT Recognised
                  </span>
                </div>
              </div>
              <span className="font-heading text-xs font-semibold tracking-[0.2em] uppercase text-neutral-400 mt-2 text-center">
                STARTUP INDIA
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Social Bar */}
        <div className="pt-8 mt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-xs font-body">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>
              &copy; {new Date().getFullYear()} AUTOCARE PULSE by NDVTechsys Solutions LLP, India.
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
