"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";

import type { OverviewPayload } from "@/lib/types/admin-dashboard";
import { formatDateShort } from "@/lib/utils/format-date-short";
import {
  BarChart,
  DonutChart,
  LineChart,
  ProgressColumnChart,
  TopFieldsCard
} from "../components/AdminDashboardCharts";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [faculty, setFaculty] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [payload, setPayload] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (faculty) qs.set("faculty", faculty);
        if (batchId) qs.set("batchId", batchId);
        const res = await fetch(`/api/admin/dashboard/overview?${qs.toString()}`, {
          method: "GET"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as OverviewPayload;
        if (cancelled) return;
        setPayload(json);

        setFaculty(json.selectedFaculty ?? "all");
        setBatchId(json.selectedBatchId ?? "all");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Không thể tải dữ liệu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [faculty, batchId]);

  const faculties = payload?.faculties ?? [];
  const batches = payload?.batches ?? [];

  const donutSegments = payload?.donut.segments ?? [];
  const donutTotal = payload?.donut.total ?? 0;

  const latestJobs = payload?.latestJobs ?? [];
  const enterprisesByField = payload?.enterprisesByField ?? { labels: [], values: [] };
  const progress = payload?.progress ?? { labels: [], values: [] };
  const lineJobPosts = payload?.lineJobPosts ?? { labels: [], series: [] };
  const topFields = payload?.topFields ?? { top: [], bottom: [] };

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
            disabled={loading || faculties.length === 0}
          >
            <option value="all">Tất cả</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.overviewControl}>
          <label>Đợt thực tập</label>
          <select
            className={styles.overviewSelect}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={loading || batches.length === 0}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error ? <div className={styles.statusNote}>Lỗi: {error}</div> : null}
      {loading ? <div className={styles.modulePlaceholder}>Đang tải dữ liệu...</div> : null}

      {!loading && payload ? (
        <section className={styles.overviewGrid}>
          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Tỷ lệ sinh viên đã thực tập theo doanh nghiệp liên kết (không tính tự túc)</h2>
            <div className={styles.chartPadding}>
              <DonutChart segments={donutSegments} />
              <div className={styles.muted} style={{ marginTop: 10 }}>
                Tổng: {donutTotal}
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.panelTitle}>Số lượng doanh nghiệp liên kết theo lĩnh vực</h2>
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

          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>Thống kê tổng số bài đăng tuyển dụng của từng doanh nghiệp</h2>
            <div className={styles.chartPadding}>
              <LineChart labels={lineJobPosts.labels} series={lineJobPosts.series} />
            </div>
          </article>

          <article className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>5 tin tuyển dụng mới nhất</h2>
            <div className={styles.tableWrap}>
              {latestJobs.length === 0 ? (
                <div className={styles.modulePlaceholder}>Chưa có dữ liệu.</div>
              ) : (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Doanh nghiệp</th>
                      <th>Đợt</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestJobs.map((j) => (
                      <tr key={j.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{j.title}</div>
                          <div className={styles.modulePlaceholder} style={{ padding: 0, marginTop: 4 }}>
                            Lĩnh vực: {j.expertise}
                          </div>
                        </td>
                        <td>{j.enterpriseName ?? "—"}</td>
                        <td>{j.batchName ?? "—"}</td>
                        <td>{formatDateShort(j.deadlineAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <div className={styles.topFieldsGrid}>
            <TopFieldsCard title="Top 5 lĩnh vực/ngành (nhiều ứng tuyển nhất)" items={topFields.top} />
            <TopFieldsCard title="Top 5 lĩnh vực/ngành (ít ứng tuyển nhất)" items={topFields.bottom} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

