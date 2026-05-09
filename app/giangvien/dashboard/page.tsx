"use client";

import { useEffect, useId, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer
} from "recharts";
import styles from "../styles/dashboard.module.css";
import {
  formatChartInt,
  RECHARTS_GRID_PROPS,
  RECHARTS_TICK_PROPS,
  RECHARTS_TOOLTIP_PROPS
} from "@/lib/constants/recharts-dashboard-ui";
import { darkenHex } from "@/lib/utils/chart-colors";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

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

const GV_CHART_ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: "ease-out" as const };

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
  const uid = useId().replace(/:/g, "");
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  const data = labels.map((name, i) => ({ name, value: values[i] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={252}>
      <BarChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 56 }}>
        <defs>
          {colors.map((c, i) => (
            <linearGradient key={`g-${i}`} id={`${uid}-gv-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={1} />
              <stop offset="100%" stopColor={darkenHex(c, 0.24)} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...RECHARTS_GRID_PROPS} />
        <XAxis
          dataKey="name"
          tick={RECHARTS_TICK_PROPS}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={72}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={40} axisLine={false} tickLine={false} />
        <Tooltip {...RECHARTS_TOOLTIP_PROPS} formatter={(v) => [formatChartInt(v as number | undefined), "Sinh viên"]} />
        <Bar dataKey="value" name="Sinh viên" radius={[12, 12, 0, 0]} maxBarSize={52} {...GV_CHART_ANIM}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={`url(#${uid}-gv-${i % colors.length})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
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
      {loading && !payload ? <div className={styles.modulePlaceholder}>Đang tải dữ liệu...</div> : null}

      {payload ? (
        <section className={styles.overviewGrid}>
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái hướng dẫn</h2>
            <StatusBarChart labels={guidanceStatus.labels} values={guidanceStatus.values} colors={GUIDANCE_COLORS} />
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng sinh viên theo trạng thái thực tập</h2>
            <StatusBarChart labels={internshipStatus.labels} values={internshipStatus.values} colors={INTERNSHIP_COLORS} />
          </article>
        </section>
      ) : null}
    </main>
  );
}
