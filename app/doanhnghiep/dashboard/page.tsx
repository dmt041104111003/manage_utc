"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import type { EnterpriseDashboardItem } from "@/lib/types/doanhnghiep-dashboard";
import {
  ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  ENTERPRISE_DASHBOARD_TASKS_EMPTY,
  ENTERPRISE_DASHBOARD_TASKS_LOADING,
  ENTERPRISE_DASHBOARD_VALUE_LOADING
} from "@/lib/constants/doanhnghiep-dashboard";
import {
  fetchEnterpriseDashboardOverview,
  getEnterpriseDashboardErrorMessage
} from "@/lib/utils/doanhnghiep-dashboard";

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

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Tin tuyển dụng đang mở</p>
          <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.openPosts ?? 0)}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Hồ sơ ứng tuyển mới</p>
          <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.newApplications ?? 0)}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Sinh viên đang tiếp nhận</p>
          <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.receivingStudents ?? 0)}</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Nhiệm vụ hôm nay</h2>
        <ul className={styles.list}>
          {(loading
            ? [ENTERPRISE_DASHBOARD_TASKS_LOADING]
            : data?.tasks?.length
              ? data.tasks
              : [ENTERPRISE_DASHBOARD_TASKS_EMPTY]
          ).map((task, idx) => (
            <li key={`${task}-${idx}`}>{task}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
