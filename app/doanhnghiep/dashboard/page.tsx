"use client";

import { useEffect, useState } from "react";
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
            {doubleBar.labels.length === 0 ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {doubleBar.labels.map((name, i) => (
                  <div key={name} className={styles.statusNote}>
                    {name}: Chấp nhận {doubleBar.accepted[i] ?? 0} | Từ chối {doubleBar.declined[i] ?? 0}
                  </div>
                ))}
              </div>
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
              <div style={{ display: "grid", gap: 8 }}>
                {lineChart.series.map((s) => (
                  <div key={s.name} className={styles.statusNote}>
                    {s.name}: {s.data.reduce((acc, v) => acc + Number(v || 0), 0)}
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Application status bar */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng hồ sơ theo trạng thái</h2>
            {applicationStatus.labels.length === 0 ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {applicationStatus.labels.map((name, i) => (
                  <div key={name} className={styles.statusNote}>{name}: {applicationStatus.values[i] ?? 0}</div>
                ))}
              </div>
            )}
          </article>

          {/* Job post status bar */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng tin tuyển dụng theo trạng thái</h2>
            {jobStatus.labels.length === 0 ? (
              <div className={styles.muted}>Chưa có dữ liệu.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {jobStatus.labels.map((name, i) => (
                  <div key={name} className={styles.statusNote}>{name}: {jobStatus.values[i] ?? 0}</div>
                ))}
              </div>
            )}
          </article>
        </section>
      ) : null}
    </main>
  );
}
