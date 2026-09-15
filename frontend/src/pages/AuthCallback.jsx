import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

// AppRouter passes control here when it detects session_id in the URL hash.
export default function AuthCallback() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash || window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) return;
    const sessionId = match[1];
    (async () => {
      try {
        const { api } = await import("@/lib/apiClient");
        await api.post("/auth/session", { session_id: sessionId });
      } catch (e) {
        // ignore, redirect will re-check
      } finally {
        window.location.replace("/dashboard");
      }
    })();
  }, [location.hash]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Securing your session…</p>
      </div>
    </div>
  );
}
