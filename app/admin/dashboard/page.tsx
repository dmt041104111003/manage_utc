"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";

import type { OverviewPayload } from "@/lib/types/admin-dashboard";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import {
  BarChart,
  DonutChart,
  LineChart,
  ProgressColumnChart,
  TopFacultiesCard
} from "../components/AdminDashboardCharts";

function adminDashboardCacheKey(faculty: string, batchId: string) {
  const qs = new URLSearchParams();
  if (faculty) qs.set("faculty", faculty);
  if (batchId) qs.set("batchId", batchId);
  return `admin:dashboard:overview:${qs.toString()}`;
}

export default function AdminDashboardPage() {
  const initialKey = adminDashboardCacheKey("all", "all");
  const [loading, setLoading] = useState(() => !hasCachedValue(initialKey));
  const [error, setError] = useState<string | null>(null);

  const [faculty, setFaculty] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [payload, setPayload] = useState<OverviewPayload | null>(() => getCachedValue<OverviewPayload>(initialKey) ?? null);

  useEffect(() => {
    let cancelled = false;
    async function load(opts?: { force?: boolean; silent?: boolean }) {
      const force = Boolean(opts?.force);
      const silent = Boolean(opts?.silent);
      const qs = new URLSearchParams();
      if (faculty) qs.set("faculty", faculty);
      if (batchId) qs.set("batchId", batchId);
      const cacheKey = adminDashboardCacheKey(faculty, batchId);
      try {
        if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
        setError(null);
        const json = await getOrFetchCached<OverviewPayload>(
          cacheKey,
          async () => {
            const res = await fetch(`/api/admin/dashboard/overview?${qs.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as OverviewPayload;
          },
          { force }
        );
        if (cancelled) return;
        setPayload(json);
        setFaculty(json.selectedFaculty ?? "all");
        setBatchId(json.selectedBatchId ?? "all");
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
  }, [faculty, batchId]);

  const faculties = payload?.faculties ?? [];
  const batches = payload?.batches ?? [];

  const applicationStatusDonut = payload?.applicationStatusDonut ?? { segments: [], total: 0 };
  const jobStatusDonut = payload?.jobStatusDonut ?? { segments: [], total: 0 };
  const enterprisesByField = payload?.enterprisesByField ?? { labels: [], values: [] };
  const progress = payload?.progress ?? { labels: [], values: [] };
  const lineJobPosts = payload?.lineJobPosts ?? { labels: [], series: [] };
  const topFaculties = payload?.topFaculties ?? { top: [], bottom: [] };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan Admin</h1>
      </header>

      <section className={styles.overviewControls}>
        <div className={styles.overviewControl}>
          <label>Khoa</label>
          <select
            className={styles.overviewSelect}
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            disabled={!payload || faculties.length === 0}
          >
            <option value="all">Tất cả</option>
            {faculties.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className={styles.overviewControl}>
          <label>Đợt thực tập</label>
          <select
            className={styles.overviewSelect}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={!payload || batches.length === 0}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error ? <div className={styles.statusNote}>Lỗi: {error}</div> : null}
      {loading && !payload ? <div className={styles.modulePlaceholder}>Đang tải dữ liệu...</div> : null}

      {payload ? (
        <section className={styles.overviewGrid}>
          {/* Row 1: Two donuts */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Trạng thái hồ sơ ứng tuyển</h2>
            <div className={styles.chartPadding}>
              <DonutChart segments={applicationStatusDonut.segments} />
              <div className={styles.muted} style={{ marginTop: 8, fontSize: 13 }}>
                Tổng: {applicationStatusDonut.total} hồ sơ
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Trạng thái tin tuyển dụng</h2>
            <div className={styles.chartPadding}>
              <DonutChart segments={jobStatusDonut.segments} />
              <div className={styles.muted} style={{ marginTop: 8, fontSize: 13 }}>
                Tổng: {jobStatusDonut.total} tin
              </div>
            </div>
          </article>

          {/* Row 2: Two bars */}
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng doanh nghiệp liên kết theo ngành/khoa</h2>
            <div className={styles.chartPadding}>
              <BarChart labels={enterprisesByField.labels} values={enterprisesByField.values} />
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Tiến độ thực tập: số lượng sinh viên theo trạng thái</h2>
            <div className={styles.chartPadding}>
              <ProgressColumnChart labels={progress.labels} values={progress.values} />
            </div>
          </article>

          {/* Row 3: Line chart full width */}
          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>Thống kê tổng số bài đăng tuyển dụng theo doanh nghiệp</h2>
            <div className={styles.chartPadding}>
              <LineChart labels={lineJobPosts.labels} series={lineJobPosts.series} />
            </div>
          </article>

          {/* Row 4: Top/Bottom tables */}
          <div className={styles.topFieldsGrid}>
            <TopFacultiesCard
              title="Top 5 khoa/ngành có ứng tuyển nhiều nhất"
              items={topFaculties.top}
            />
            <TopFacultiesCard
              title="Top 5 khoa/ngành có ứng tuyển ít nhất"
              items={topFaculties.bottom}
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
