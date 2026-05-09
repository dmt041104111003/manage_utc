"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

type Batch = { id: string; name: string; status: string };

type ChartData = {
  labels: string[];
  values: number[];
};

type OverviewPayload = {
  success: boolean;
  batches: Batch[];
  selectedBatchId: string | null;
  guidanceStatus: ChartData;
  internshipStatus: ChartData;
};

export default function LecturerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState("all");
  const [payload, setPayload] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(opts?: { force?: boolean; silent?: boolean }) {
      const force = Boolean(opts?.force);
      const silent = Boolean(opts?.silent);
      try {
        const qs = new URLSearchParams();
        if (batchId && batchId !== "all") qs.set("batchId", batchId);
        const url = `/api/giangvien/dashboard/overview?${qs.toString()}`;
        const cacheKey = `gv:dashboard:overview:${url}`;
        if (!silent && (force || !hasCachedValue(cacheKey))) setLoading(true);
        setError(null);
        const json = await getOrFetchCached<OverviewPayload>(
          cacheKey,
          async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as OverviewPayload;
          },
          { force }
        );
        if (cancelled) return;
        setPayload(json);
        if (json.selectedBatchId && batchId === "all") setBatchId(json.selectedBatchId);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Không thể tải dữ liệu.");
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [batchId]);

  const batches = payload?.batches ?? [];
  const guidanceStatus = payload?.guidanceStatus ?? { labels: [], values: [] };
  const internshipStatus = payload?.internshipStatus ?? { labels: [], values: [] };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan Giảng viên hướng dẫn</h1>
      </header>

      <section className={styles.overviewControls}>
        <div className={styles.overviewControl}>
          <label>Đợt thực tập</label>
          <select
            className={styles.overviewSelect}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={loading || batches.length === 0}
          >
            {batches.length === 0 && <option value="all">Chưa có đợt thực tập</option>}
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error ? <div className={styles.modulePlaceholder}>Lỗi: {error}</div> : null}
      {loading ? <div className={styles.modulePlaceholder}>Đang tải dữ liệu...</div> : null}

      {!loading && payload ? (
        <section className={styles.overviewGrid}>
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái hướng dẫn</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {guidanceStatus.labels.length === 0 ? (
                <div className={styles.muted}>Chưa có dữ liệu.</div>
              ) : (
                guidanceStatus.labels.map((name, i) => (
                  <div key={name} className={styles.statusNote}>{name}: {guidanceStatus.values[i] ?? 0}</div>
                ))
              )}
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái thực tập</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {internshipStatus.labels.length === 0 ? (
                <div className={styles.muted}>Chưa có dữ liệu.</div>
              ) : (
                internshipStatus.labels.map((name, i) => (
                  <div key={name} className={styles.statusNote}>{name}: {internshipStatus.values[i] ?? 0}</div>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
