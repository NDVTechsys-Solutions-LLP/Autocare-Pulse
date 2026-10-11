import React, { useEffect, useRef } from "react";

// Embedded Amazon Connect Contact Control Panel (agent softphone).
// Requires AWS_CONNECT_CCP_URL in backend/.env and this origin approved in
// Amazon Connect -> Application integration -> Approved origins.
export default function CCPSoftphone({ ccpUrl }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ccpUrl || !ref.current) return;
    let cancelled = false;
    (async () => {
      await import("amazon-connect-streams");
      if (cancelled || !ref.current || !window.connect) return;
      try {
        window.connect.core.initCCP(ref.current, {
          ccpUrl,
          loginPopup: true,
          loginPopupAutoClose: true,
          softphone: { allowFramedSoftphone: true },
          pageOptions: { enableAudioDeviceSettings: true, enablePhoneTypeSettings: true },
        });
        window.connect.core.onAuthFail(() => console.error("Amazon Connect session expired"));
      } catch (e) {
        console.error("CCP init failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [ccpUrl]);

  if (!ccpUrl) {
    return (
      <div data-testid="ccp-softphone-placeholder" className="rounded-2xl border border-dashed border-white/10 bg-[#0e1015]/60 p-8 text-center">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white">Embedded Softphone</h3>
        <p className="mt-2 text-xs text-neutral-400 font-light leading-relaxed max-w-lg mx-auto">
          Add <span className="font-mono text-[#00F0FF] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/10">AWS_CONNECT_CCP_URL</span> (e.g.
          <span className="font-mono text-neutral-300"> https://your-instance.my.connect.aws/ccp-v2/</span>) to <span className="font-mono text-neutral-300">backend/.env</span> and approve this app's origin in
          Amazon Connect → Application integration → Approved origins to embed the live agent softphone here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e1015] p-6 hover:border-white/15 transition-all">
      <h3 className="mb-4 font-heading text-lg font-bold uppercase tracking-tight text-white">Embedded Softphone</h3>
      <div ref={ref} data-testid="ccp-softphone" className="h-[560px] w-full overflow-hidden rounded-xl border border-white/10 bg-black" />
    </div>
  );
}
