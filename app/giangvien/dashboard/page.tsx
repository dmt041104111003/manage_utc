"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import { ReactEchart } from "@/app/components/charts/ReactEchart";
import { buildPerBarColorChartOption } from "@/lib/utils/echarts-dashboard-options";

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

const GUIDANCE_COLORS = ["#2563eb", "#16a34a"];
const INTERNSHIP_COLORS = [
  "#6b7280", "#2563eb", "#0ea5e9", "#f59e0b", "#16a34a", "#ef4444"
];

function gvDashboardOverviewCacheKey(batchId: string) {
  const qs = new URLSearchParams();
  if (batchId && batchId !== "all") qs.set("batchId", batchId);
  const url = `/api/giangvien/dashboard/overview?${qs.toString()}`;
  return `gv:dashboard:overview:${url}`;
}

const GV_DASHBOARD_INITIAL_KEY = gvDashboardOverviewCacheKey("all");

function StatusBarChart({
  labels,
  values,
  colors
}: {
  labels: string[];
  values: number[];
  colors: string[];
}) {
  const option = useMemo(
    () => buildPerBarColorChartOption(labels, values, colors, "Sinh viên"),
    [labels, values, colors]
  );
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={252} clickReloadPulse />;
}

export default function LecturerDashboardPage() {
  const [loading, setLoading] = useState(() => !hasCachedValue(GV_DASHBOARD_INITIAL_KEY));
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState("all");
  const [payload, setPayload] = useState<OverviewPayload | null>(() => getCachedValue<OverviewPayload>(GV_DASHBOARD_INITIAL_KEY) ?? null);

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
        if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
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
            disabled={!payload || batches.length === 0}
          >
            {batches.length === 0 && <option value="all">Chưa có đợt thực tập</option>}
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error ? <div className={styles.modulePlaceholder}>Lỗi: {error}</div> : null}
      {loading && !payload ? (
        <ChartStyleLoading variant="block" message="Đang tải dữ liệu…" />
      ) : null}

      {payload ? (
        <section className={styles.overviewGrid}>
          <div className={styles.chartCardShell}>
            <article className={styles.card}>
              <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái hướng dẫn</h2>
              <StatusBarChart labels={guidanceStatus.labels} values={guidanceStatus.values} colors={GUIDANCE_COLORS} />
            </article>
          </div>

          <div className={styles.chartCardShell}>
            <article className={styles.card}>
              <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái thực tập</h2>
              <StatusBarChart
                labels={internshipStatus.labels}
                values={internshipStatus.values}
                colors={INTERNSHIP_COLORS}
              />
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
