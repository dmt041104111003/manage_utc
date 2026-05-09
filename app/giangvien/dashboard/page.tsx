"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import type { LecturerDashboardItem } from "@/lib/types/giangvien-dashboard";
import {
  GIANGVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  GIANGVIEN_DASHBOARD_OVERVIEW_ENDPOINT,
  GIANGVIEN_DASHBOARD_TASKS_EMPTY,
  GIANGVIEN_DASHBOARD_TASKS_LOADING,
  GIANGVIEN_DASHBOARD_VALUE_LOADING
} from "@/lib/constants/giangvien-dashboard";
import {
  fetchLecturerDashboardOverview,
  getLecturerDashboardErrorMessage
} from "@/lib/utils/giangvien-dashboard";

export default function LecturerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LecturerDashboardItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchLecturerDashboardOverview();
        if (cancelled) return;
        setData(json.item);
      } catch (e) {
        if (cancelled) return;
        setError(getLecturerDashboardErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Giảng viên</h1>
        <p className={styles.subtitle}>Theo dõi tiến độ thực tập của sinh viên phụ trách.</p>
      </header>

      {error ? <p className={styles.modulePlaceholder}>Lỗi tải dữ liệu: {error}</p> : null}

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Sinh viên phụ trách</p>
          <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.assignedStudents ?? 0)}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Báo cáo chờ duyệt</p>
          <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.pendingReports ?? 0)}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Lịch đánh giá tuần này</p>
          <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.weeklyReviews ?? 0)}</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Việc cần làm</h2>
        <ul className={styles.list}>
          {(loading ? [GIANGVIEN_DASHBOARD_TASKS_LOADING] : data?.tasks?.length ? data.tasks : [GIANGVIEN_DASHBOARD_TASKS_EMPTY]).map((task, idx) => (
            <li key={`${task}-${idx}`}>{task}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
