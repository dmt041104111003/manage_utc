"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";

import type { StudentDashboardItem } from "@/lib/types/sinhvien-dashboard";
import {
  SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  SINHVIEN_DASHBOARD_TASKS_EMPTY,
  SINHVIEN_DASHBOARD_TASKS_LOADING,
  SINHVIEN_DASHBOARD_VALUE_LOADING
} from "@/lib/constants/sinhvien-dashboard";
import { fetchStudentDashboardOverview, getStudentDashboardErrorMessage } from "@/lib/utils/sinhvien-dashboard";

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentDashboardItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchStudentDashboardOverview();
        if (cancelled) return;
        setData(json.item);
      } catch (e) {
        if (cancelled) return;
        setError(getStudentDashboardErrorMessage(e) || SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE);
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
        <h1 className={styles.title}>Dashboard Sinh viên</h1>
        <p className={styles.subtitle}>Quản lý tiến độ thực tập và theo dõi các mốc quan trọng.</p>
      </header>

      {error ? <p className={styles.modulePlaceholder}>Lỗi tải dữ liệu: {error}</p> : null}

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Trạng thái thực tập</p>
          <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : data?.internshipStatus ?? "—"}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Báo cáo đã nộp</p>
          <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : String(data?.reportSubmittedCount ?? 0)}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Phản hồi mới</p>
          <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : String(data?.newFeedbackCount ?? 0)}</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Nhắc việc</h2>
        <ul className={styles.list}>
          {(loading
            ? [SINHVIEN_DASHBOARD_TASKS_LOADING]
            : data?.tasks?.length
              ? data.tasks
              : [SINHVIEN_DASHBOARD_TASKS_EMPTY]
          ).map((task, idx) => (
            <li key={`${task}-${idx}`}>{task}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
