"use client";

import { useCallback, useEffect, useState } from "react";
import type { PendingEnterpriseItem } from "@/lib/types/admin";

export function usePendingEnterpriseDetail(id: string) {
  const [item, setItem] = useState<PendingEnterpriseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!id) {
      setError("Thiếu mã hồ sơ.");
      setLoading(false);
      setItem(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pending-enterprises/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được chi tiết.");
      setItem(data.item || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu.");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { item, loading, error, reload };
}
