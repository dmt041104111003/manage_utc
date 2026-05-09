"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import type { LecturerDashboardItem } from "@/lib/types/giangvien-dashboard";
import {
  GIANGVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE
} from "@/lib/constants/giangvien-dashboard";
import {
  fetchLecturerDashboardOverview,
  getLecturerDashboardErrorMessage
} from "@/lib/utils/giangvien-dashboard";
import LecturerDashboardStats from "./components/LecturerDashboardStats";
import LecturerDashboardTasks from "./components/LecturerDashboardTasks";

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

      <LecturerDashboardStats loading={loading} data={data} />
      <LecturerDashboardTasks loading={loading} data={data} />
    </main>
  );
}
