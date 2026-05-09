"use client";

import { useEffect, useId, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";
import styles from "../styles/dashboard.module.css";
import {
  formatChartInt,
  RECHARTS_GRID_PROPS,
  RECHARTS_GRID_PROPS_LINE,
  RECHARTS_LEGEND_WRAPPER_STYLE,
  RECHARTS_TICK_PROPS,
  RECHARTS_TOOLTIP_PROPS
} from "@/lib/constants/recharts-dashboard-ui";
import { darkenHex } from "@/lib/utils/chart-colors";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

type SimpleChartSeries = { name: string; data: number[]; color: string };

type OverviewPayload = {
  success: boolean;
  doubleBar: { labels: string[]; accepted: number[]; declined: number[] };
  lineChart: { labels: string[]; series: SimpleChartSeries[] };
  applicationStatus: { labels: string[]; values: number[] };
  jobStatus: { labels: string[]; values: number[] };
};

const APP_STATUS_COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#ef4444"];
const JOB_STATUS_COLORS = ["#f59e0b", "#ef4444", "#16a34a", "#6b7280"];

const CHART_ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: "ease-out" as const };

export default function EnterpriseDashboardPage() {
  const chartUid = useId().replace(/:/g, "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payload, setPayload] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(opts?: { force?: boolean; silent?: boolean }) {
      const force = Boolean(opts?.force);
      const silent = Boolean(opts?.silent);
      try {
        const qs = new URLSearchParams();
        if (dateFrom) qs.set("dateFrom", dateFrom);
        if (dateTo) qs.set("dateTo", dateTo);
        const url = `/api/doanhnghiep/dashboard/overview?${qs.toString()}`;
        const cacheKey = `enterprise:dashboard:overview:${url}`;
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
  }, [dateFrom, dateTo]);

  const doubleBar = payload?.doubleBar ?? { labels: [], accepted: [], declined: [] };
  const lineChart = payload?.lineChart ?? { labels: [], series: [] };
  const applicationStatus = payload?.applicationStatus ?? { labels: [], values: [] };
  const jobStatus = payload?.jobStatus ?? { labels: [], values: [] };

  const doubleBarData = doubleBar.labels.map((name, i) => ({
    name,
    "SV chấp nhận": doubleBar.accepted[i] ?? 0,
    "SV từ chối": doubleBar.declined[i] ?? 0
  }));

  const appStatusData = applicationStatus.labels.map((name, i) => ({
    name,
    value: applicationStatus.values[i] ?? 0
  }));

  const jobStatusData = jobStatus.labels.map((name, i) => ({
    name,
    value: jobStatus.values[i] ?? 0
  }));

  const lineData = lineChart.labels.map((name, i) => {
    const point: Record<string, string | number> = { name };
    lineChart.series.forEach((s) => { point[s.name] = s.data[i] ?? 0; });
    return point;
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan Doanh nghiệp</h1>
      </header>

      <section className={styles.overviewControls}>
        <div className={styles.overviewControl}>
          <label>Từ ngày</label>
          <input
            type="date"
            className={styles.overviewInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className={styles.overviewControl}>
          <label>Đến ngày</label>
          <input
            type="date"
            className={styles.overviewInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </section>

      {error ? <div className={styles.modulePlaceholder}>Lỗi: {error}</div> : null}
      {loading ? <div className={styles.modulePlaceholder}>Đang tải dữ liệu...</div> : null}

      {!loading && payload ? (
        <section className={styles.overviewGrid}>
          {/* Double bar: SV accepted vs declined by expertise */}
          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>
              Số SV chấp nhận &amp; từ chối thực tập theo ngành/khoa
            </h2>
            {doubleBarData.length === 0 ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={doubleBarData} margin={{ top: 14, right: 24, left: 4, bottom: 50 }}>
                  <defs>
                    <linearGradient id={`${chartUid}-dbl-ok`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                    <linearGradient id={`${chartUid}-dbl-no`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...RECHARTS_GRID_PROPS} />
                  <XAxis
                    dataKey="name"
                    tick={RECHARTS_TICK_PROPS}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={68}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={40} axisLine={false} tickLine={false} />
                  <Tooltip {...RECHARTS_TOOLTIP_PROPS} formatter={(v) => formatChartInt(v as number | undefined)} />
                  <Legend iconType="circle" iconSize={11} wrapperStyle={RECHARTS_LEGEND_WRAPPER_STYLE} />
                  <Bar
                    dataKey="SV chấp nhận"
                    fill={`url(#${chartUid}-dbl-ok)`}
                    radius={[10, 10, 0, 0]}
                    maxBarSize={44}
                    {...CHART_ANIM}
                  />
                  <Bar
                    dataKey="SV từ chối"
                    fill={`url(#${chartUid}-dbl-no)`}
                    radius={[10, 10, 0, 0]}
                    maxBarSize={44}
                    {...CHART_ANIM}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>

          {/* Line chart: applications per expertise per month */}
          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>
              Số lượng SV ứng tuyển theo ngành/khoa (theo tháng)
            </h2>
            {lineChart.series.length === 0 ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={292}>
                <LineChart data={lineData} margin={{ top: 16, right: 28, left: 4, bottom: 16 }}>
                  <CartesianGrid {...RECHARTS_GRID_PROPS_LINE} />
                  <XAxis dataKey="name" tick={RECHARTS_TICK_PROPS} axisLine={{ stroke: "#cbd5e1" }} tickLine={{ stroke: "#cbd5e1" }} />
                  <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={42} axisLine={false} tickLine={false} />
                  <Tooltip {...RECHARTS_TOOLTIP_PROPS} formatter={(v) => formatChartInt(v as number | undefined)} />
                  <Legend iconType="circle" iconSize={11} wrapperStyle={RECHARTS_LEGEND_WRAPPER_STYLE} />
                  {lineChart.series.map((s) => (
                    <Line
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={s.color}
                      strokeWidth={2.75}
                      dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: s.color }}
                      activeDot={{ r: 7, strokeWidth: 0, fill: s.color }}
                      {...CHART_ANIM}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </article>

          {/* Application status bar */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng hồ sơ theo trạng thái</h2>
            {appStatusData.every((d) => d.value === 0) ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={248}>
                <BarChart data={appStatusData} margin={{ top: 12, right: 20, left: 4, bottom: 44 }}>
                  <defs>
                    {APP_STATUS_COLORS.map((c, i) => (
                      <linearGradient key={`app-${i}`} id={`${chartUid}-app-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={darkenHex(c, 0.22)} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid {...RECHARTS_GRID_PROPS} />
                  <XAxis
                    dataKey="name"
                    tick={RECHARTS_TICK_PROPS}
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    height={58}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={40} axisLine={false} tickLine={false} />
                  <Tooltip {...RECHARTS_TOOLTIP_PROPS} formatter={(v) => [formatChartInt(v as number | undefined), "Hồ sơ"]} />
                  <Bar dataKey="value" name="Hồ sơ" radius={[12, 12, 0, 0]} maxBarSize={52} {...CHART_ANIM}>
                    {appStatusData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={`url(#${chartUid}-app-${i % APP_STATUS_COLORS.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>

          {/* Job post status bar */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng tin tuyển dụng theo trạng thái</h2>
            {jobStatusData.every((d) => d.value === 0) ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={248}>
                <BarChart data={jobStatusData} margin={{ top: 12, right: 20, left: 4, bottom: 44 }}>
                  <defs>
                    {JOB_STATUS_COLORS.map((c, i) => (
                      <linearGradient key={`job-${i}`} id={`${chartUid}-job-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={darkenHex(c, 0.22)} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid {...RECHARTS_GRID_PROPS} />
                  <XAxis
                    dataKey="name"
                    tick={RECHARTS_TICK_PROPS}
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    height={58}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={40} axisLine={false} tickLine={false} />
                  <Tooltip {...RECHARTS_TOOLTIP_PROPS} formatter={(v) => [formatChartInt(v as number | undefined), "Tin đăng"]} />
                  <Bar dataKey="value" name="Tin đăng" radius={[12, 12, 0, 0]} maxBarSize={52} {...CHART_ANIM}>
                    {jobStatusData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={`url(#${chartUid}-job-${i % JOB_STATUS_COLORS.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>
        </section>
      ) : null}
    </main>
  );
}
