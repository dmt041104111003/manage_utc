"use client";

import { useEffect, useState } from "react";
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

export default function EnterpriseDashboardPage() {
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
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={doubleBarData} margin={{ top: 5, right: 24, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="SV chấp nhận" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SV từ chối" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lineData} margin={{ top: 5, right: 24, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  {lineChart.series.map((s) => (
                    <Line
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={appStatusData}
                  margin={{ top: 5, right: 16, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip />
                  <Bar dataKey="value" name="Hồ sơ" radius={[4, 4, 0, 0]}>
                    {appStatusData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={APP_STATUS_COLORS[i % APP_STATUS_COLORS.length]}
                      />
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={jobStatusData}
                  margin={{ top: 5, right: 16, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip />
                  <Bar dataKey="value" name="Tin đăng" radius={[4, 4, 0, 0]}>
                    {jobStatusData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={JOB_STATUS_COLORS[i % JOB_STATUS_COLORS.length]}
                      />
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
