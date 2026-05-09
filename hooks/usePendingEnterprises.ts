"use client";

import { useCallback, useEffect, useState } from "react";
import type { PendingEnterpriseItem } from "@/lib/types/admin";

export function usePendingEnterprises() {
  const [items, setItems] = useState<PendingEnterpriseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pending-enterprises");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách.");
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
