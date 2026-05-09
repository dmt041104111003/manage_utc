"use client";

import { useCallback, useEffect, useState } from "react";

const POLL_MS = 60_000;

export const ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT = "admin-pending-enterprises-changed";

export function useAdminPendingEnterpriseCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/admin/pending-enterprises/count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count?: unknown };
      if (typeof data.count === "number" && Number.isFinite(data.count)) {
        setCount(Math.max(0, data.count));
      }
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => void refresh(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onPendingChanged = () => void refresh();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT, onPendingChanged);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT, onPendingChanged);
    };
  }, [enabled, refresh]);

  return { count, refresh };
}
