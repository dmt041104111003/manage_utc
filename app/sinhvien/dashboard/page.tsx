"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import type { StudentDashboardItem } from "@/lib/types/sinhvien-dashboard";
import { SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE } from "@/lib/constants/sinhvien-dashboard";
import { fetchStudentDashboardOverview, getStudentDashboardErrorMessage } from "@/lib/utils/sinhvien-dashboard";
import StudentDashboardStats from "./components/StudentDashboardStats";
import StudentDashboardTasks from "./components/StudentDashboardTasks";

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

      <StudentDashboardStats loading={loading} data={data} />
      <StudentDashboardTasks loading={loading} data={data} />
    </main>
  );
}
