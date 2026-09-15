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
      <div data-testid="ccp-softphone-placeholder" className="rounded-xl border border-dashed border-border bg-card/50 p-6">
        <h3 className="font-heading text-xl font-semibold">Embedded Softphone</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add <span className="font-mono text-accent">AWS_CONNECT_CCP_URL</span> (e.g.
          <span className="font-mono"> https://your-instance.my.connect.aws/ccp-v2/</span>) to <span className="font-mono">backend/.env</span> and approve this app's origin in
          Amazon Connect → Application integration → Approved origins to embed the live agent softphone here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-[#111827] p-3">
      <h3 className="mb-2 font-heading text-xl font-semibold">Embedded Softphone</h3>
      <div ref={ref} data-testid="ccp-softphone" className="h-[560px] w-full overflow-hidden rounded-lg border border-border bg-black" />
    </div>
  );
}
