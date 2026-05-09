"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import type { JobRow, JobStatus } from "@/lib/types/doanhnghiep-ung-vien";
import {
  DOANHNGHIEP_UNG_VIEN_ERROR_DEFAULT,
  DOANHNGHIEP_UNG_VIEN_PAGE_SIZE
} from "@/lib/constants/doanhnghiep-ung-vien";
import { buildDoanhNghiepUngVienListUrl, getDoanhNghiepUngVienLoadErrorMessage } from "@/lib/utils/doanhnghiep-ung-vien";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import UngVienToolbar from "./components/UngVienToolbar";
import UngVienTableSection from "./components/UngVienTableSection";

type AppStats = {
  PENDING_REVIEW: number;
  INTERVIEW_INVITED: number;
  OFFERED: number;
  REJECTED: number;
  STUDENT_DECLINED: number;
};

const EMPTY_APP_STATS: AppStats = {
  PENDING_REVIEW: 0, INTERVIEW_INVITED: 0, OFFERED: 0, REJECTED: 0, STUDENT_DECLINED: 0
};

export default function DoanhNghiepUngVienPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<JobRow[]>([]);
  const [appStats, setAppStats] = useState<AppStats>(EMPTY_APP_STATS);

  const [q, setQ] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  async function load(nextPage = 1, opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const url = buildDoanhNghiepUngVienListUrl({
        origin: window.location.origin,
        q,
        createdDate,
        deadlineDate,
        status
      });
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(DOANHNGHIEP_UNG_VIEN_PAGE_SIZE));
      const cacheKey = `enterprise:ung-vien:list:${url.toString()}`;
      if (!silent && (force || !hasCachedValue(cacheKey))) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url.toString());
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || DOANHNGHIEP_UNG_VIEN_ERROR_DEFAULT);
          return payload;
        },
        { force }
      );
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.appStats) setAppStats(data.appStats as AppStats);
      setTotalItems(Number(data.totalItems || 0));
      setPage(nextPage);
    } catch (e: unknown) {
      setError(getDoanhNghiepUngVienLoadErrorMessage(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load(page, { force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, createdDate, deadlineDate, status]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý ứng viên</h1>
        <p className={styles.subtitle}>Theo dõi số lượng ứng viên ứng tuyển theo từng tin và xem chi tiết hồ sơ.</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {/* Stat cards: application status counts */}
      {!loading && (
        <div className={styles.statsGrid}>
          {[
            { label: "Chờ xem xét",   count: appStats.PENDING_REVIEW },
            { label: "Mời phỏng vấn", count: appStats.INTERVIEW_INVITED },
            { label: "Trúng tuyển",   count: appStats.OFFERED },
            { label: "Từ chối",       count: appStats.REJECTED + appStats.STUDENT_DECLINED }
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      <UngVienToolbar
        q={q}
        createdDate={createdDate}
        deadlineDate={deadlineDate}
        status={status}
        loading={loading}
        onQChange={setQ}
        onCreatedDateChange={setCreatedDate}
        onDeadlineDateChange={setDeadlineDate}
        onStatusChange={setStatus}
        onSearch={() => void load(1, { force: true })}
      />

      <UngVienTableSection
        loading={loading}
        items={items}
        totalItems={totalItems}
        page={page}
        onPageChange={(p) => void load(p, { force: true })}
      />
    </main>
  );
}
