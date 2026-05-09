"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";

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

function enterpriseDashboardOverviewCacheKey(dateFrom: string, dateTo: string) {
  const qs = new URLSearchParams();
  if (dateFrom) qs.set("dateFrom", dateFrom);
  if (dateTo) qs.set("dateTo", dateTo);
  const url = `/api/doanhnghiep/dashboard/overview?${qs.toString()}`;
  return `enterprise:dashboard:overview:${url}`;
}

const ENTERPRISE_DASHBOARD_INITIAL_KEY = enterpriseDashboardOverviewCacheKey("", "");

function SimpleBarBlock({
  labels,
  values,
  colors,
  unit
}: {
  labels: string[];
  values: number[];
  colors: string[];
  unit: string;
}) {
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  const max = Math.max(1, ...values);
  return (
    <div className={styles.barChart}>
      <div className={styles.barArea}>
        {labels.map((label, i) => (
          <div key={`${label}-${i}`} className={styles.barCol}>
            <div
              className={styles.bar}
              style={{
                height: `${Math.max(2, Math.round(((values[i] ?? 0) / max) * 160))}px`,
                background: colors[i % colors.length]
              }}
            />
            <div className={styles.barLabel}>{label}</div>
            <div className={styles.muted} style={{ fontSize: 11, fontWeight: 600 }}>
              {values[i] ?? 0} {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoubleBarBlock({
  labels,
  accepted,
  declined
}: {
  labels: string[];
  accepted: number[];
  declined: number[];
}) {
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  const max = Math.max(1, ...accepted, ...declined);
  return (
    <div className={styles.barChart}>
      <div className={styles.barArea}>
        {labels.map((label, i) => (
          <div key={`${label}-${i}`} className={styles.barCol}>
            <div className={styles.barPair}>
              <div
                className={styles.bar}
                style={{
                  height: `${Math.max(2, Math.round(((accepted[i] ?? 0) / max) * 120))}px`,
                  background: "linear-gradient(180deg, #4ade80, #15803d)",
                  maxWidth: 26
                }}
              />
              <div
                className={styles.bar}
                style={{
                  height: `${Math.max(2, Math.round(((declined[i] ?? 0) / max) * 120))}px`,
                  background: "linear-gradient(180deg, #fb7185, #b91c1c)",
                  maxWidth: 26
                }}
              />
            </div>
            <div className={styles.barLabel}>{label}</div>
            <div className={styles.muted} style={{ fontSize: 10, lineHeight: 1.35 }}>
              Chấp nhận: <strong>{accepted[i] ?? 0}</strong>
              <br />
              Từ chối: <strong>{declined[i] ?? 0}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineDataTable({
  labels,
  series
}: {
  labels: string[];
  series: SimpleChartSeries[];
}) {
  if (labels.length === 0 || series.length === 0) {
    return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  }
  return (
    <div className={styles.lineWrap} style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "8px 10px",
                border: "1px solid #cbd5e1",
                background: "#e2e8f0",
                fontWeight: 700
              }}
            >
              Tháng
            </th>
            {series.map((s) => (
              <th
                key={s.name}
                style={{
                  textAlign: "right",
                  padding: "8px 10px",
                  border: "1px solid #cbd5e1",
                  background: "#e2e8f0",
                  fontWeight: 700,
                  whiteSpace: "nowrap"
                }}
              >
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, rowIdx) => (
            <tr key={label}>
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 600 }}>{label}</td>
              {series.map((s) => (
                <td
                  key={s.name}
                  style={{
                    textAlign: "right",
                    padding: "8px 10px",
                    border: "1px solid #cbd5e1",
                    color: "#374151"
                  }}
                >
                  {s.data[rowIdx] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EnterpriseDashboardPage() {
  const [loading, setLoading] = useState(() => !hasCachedValue(ENTERPRISE_DASHBOARD_INITIAL_KEY));
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payload, setPayload] = useState<OverviewPayload | null>(() => getCachedValue<OverviewPayload>(ENTERPRISE_DASHBOARD_INITIAL_KEY) ?? null);

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
      {loading && !payload ? (
        <ChartStyleLoading variant="block" message="Đang tải dữ liệu…" />
      ) : null}

      {payload ? (
        <section className={styles.overviewGrid}>
          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>
              Số SV chấp nhận &amp; từ chối thực tập theo ngành/khoa
            </h2>
            <DoubleBarBlock
              labels={doubleBar.labels}
              accepted={doubleBar.accepted}
              declined={doubleBar.declined}
            />
          </article>

          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>
              Số lượng SV ứng tuyển theo ngành/khoa (theo tháng)
            </h2>
            <LineDataTable labels={lineChart.labels} series={lineChart.series} />
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng hồ sơ theo trạng thái</h2>
            {applicationStatus.values.every((v) => v === 0) ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <SimpleBarBlock
                labels={applicationStatus.labels}
                values={applicationStatus.values}
                colors={APP_STATUS_COLORS}
                unit="hồ sơ"
              />
            )}
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng tin tuyển dụng theo trạng thái</h2>
            {jobStatus.values.every((v) => v === 0) ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <SimpleBarBlock
                labels={jobStatus.labels}
                values={jobStatus.values}
                colors={JOB_STATUS_COLORS}
                unit="tin"
              />
            )}
          </article>
        </section>
      ) : null}
    </main>
  );
}
