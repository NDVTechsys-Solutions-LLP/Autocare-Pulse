import React from "react";
import { X, ShieldCheck } from "lucide-react";

export default function LegalModal({ isOpen, onClose, docType }) {
  if (!isOpen) return null;

  const isPrivacy = docType === "privacy";
  const isErss = docType === "erss";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-8 rounded-2xl bg-[#0c111d] border border-white/10 p-6 sm:p-8 shadow-2xl text-left text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#e60012]/10 border border-[#e60012]/25 flex items-center justify-center text-[#e60012]">
            <ShieldCheck size={18} />
          </div>
          <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-white">
            {isPrivacy ? "Privacy Policy" : isErss ? "112 ERSS Interoperability" : "Terms & Conditions"}
          </h2>
        </div>

        <div className="mt-4 space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          {isErss ? (
            <>
              <p>
                <strong>AutoCare Pulse</strong> is engineered to comply with the National Emergency Response Support System (112 ERSS) telematics interoperability specifications.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                1. Automated Crash &amp; Distress Handover
              </h4>
              <p>
                In the event of severe collision detection or SOS trigger, AutoCare Pulse prepares standardized incident telemetry payloads (vehicle coordinates, impact severity score, fuel cutoff status, and occupant contact) for verified emergency dispatch interop.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                2. Data Integrity &amp; Encrypted Dispatch
              </h4>
              <p>
                Emergency telemetry is transmitted over TLS 1.3 encrypted conduits to authorized regional Public Safety Answering Points (PSAP) and roadside rescue networks.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                3. Operational Inquiries
              </h4>
              <p>
                For technical questions regarding 112 ERSS integration, contact our engineering desk at{" "}
                <a href="mailto:customercare@ndvtechsys.com" className="text-[#00F0FF] underline">
                  customercare@ndvtechsys.com
                </a>
                .
              </p>
            </>
          ) : isPrivacy ? (
            <>
              <p>
                <strong>AutoCare Pulse</strong> (by NDVTechsys Solutions LLP) is committed to safeguarding vehicle telemetry, diagnostic logs, and personal identifiers.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                1. Data Collection &amp; Use
              </h4>
              <p>
                Vehicle diagnostic photos, audio symptom recordings, and GPS coordinates are processed strictly for operational breakdown triage, emergency roadside assistance dispatch, and authorized workshop bay allocation.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                2. Data Protection &amp; Sharing
              </h4>
              <p>
                Incident telemetry is shared only with verified recovery operators, authorized dealership technicians, and (during critical emergencies) national 112 ERSS responders. We do not sell or monetize vehicle telemetry.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                3. Contact Information
              </h4>
              <p>
                Inquiries regarding data rights may be directed to our operations desk at{" "}
                <a href="mailto:customer@ndvTexas.com" className="text-[#e60012] underline">
                  customer@ndvTexas.com
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p>
                These Terms govern driver and dealership access to the AutoCare Pulse telematics platform and associated incident triage tools.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                1. Platform Scope
              </h4>
              <p>
                AutoCare Pulse provides telematics-assisted diagnostic triage and service routing. It serves as an assistive advisory tool and does not substitute for on-site certified mechanic inspection.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                2. Roadside Rescue Dispatch
              </h4>
              <p>
                Estimated arrival times for roadside tow trucks and emergency mobile service units are calculated based on traffic conditions and regional operator coverage.
              </p>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                3. Dealership Service Bay Reservations
              </h4>
              <p>
                Workshop appointments reserved through the application are held in coordination with authorized service centers subject to bay capacity and verified arrival times.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#e60012] hover:bg-[#c80010] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
