"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import type { EnterpriseDashboardItem } from "@/lib/types/doanhnghiep-dashboard";
import { ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE } from "@/lib/constants/doanhnghiep-dashboard";
import {
  fetchEnterpriseDashboardOverview,
  getEnterpriseDashboardErrorMessage
} from "@/lib/utils/doanhnghiep-dashboard";
import EnterpriseDashboardStats from "./components/EnterpriseDashboardStats";
import EnterpriseDashboardTasks from "./components/EnterpriseDashboardTasks";

export default function EnterpriseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EnterpriseDashboardItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchEnterpriseDashboardOverview();
        if (cancelled) return;
        setData(json.item);
      } catch (e) {
        if (cancelled) return;
        setError(getEnterpriseDashboardErrorMessage(e) || ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE);
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
        <h1 className={styles.title}>Dashboard Doanh nghiệp</h1>
      </header>

      {error ? <p className={styles.modulePlaceholder}>Lỗi tải dữ liệu: {error}</p> : null}

      <EnterpriseDashboardStats loading={loading} data={data} />
      <EnterpriseDashboardTasks loading={loading} data={data} />
    </main>
  );
}
