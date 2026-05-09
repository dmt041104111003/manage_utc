"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type {
  RespondAction,
  SinhVienQuanLyDangKyUngTuyenRow,
  StatusFilter
} from "@/lib/types/sinhvien-quan-ly-dang-ky-ung-tuyen";
import {
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_SUCCESS_DEFAULT
} from "@/lib/constants/sinhvien-quan-ly-dang-ky-ung-tuyen";
import {
  buildSinhVienQuanLyDangKyUngTuyenRespondEndpoint,
  buildSinhVienQuanLyDangKyUngTuyenListUrl
} from "@/lib/utils/sinhvien-quan-ly-dang-ky-ung-tuyen";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import QuanLyUngTuyenToolbar from "./components/QuanLyUngTuyenToolbar";
import QuanLyUngTuyenTableSection from "./components/QuanLyUngTuyenTableSection";

type StatCard = {
  label: string;
  count: number;
};

function computeStats(rows: SinhVienQuanLyDangKyUngTuyenRow[]): StatCard[] {
  return [
    { label: "Chờ xem xét",   count: rows.filter((r) => r.status === "PENDING_REVIEW").length },
    { label: "Mời phỏng vấn", count: rows.filter((r) => r.status === "INTERVIEW_INVITED").length },
    { label: "Trúng tuyển",   count: rows.filter((r) => r.status === "OFFERED").length },
    { label: "Từ chối",       count: rows.filter((r) => r.status === "REJECTED" || r.status === "STUDENT_DECLINED").length }
  ];
}

export default function SinhVienQuanLyUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Always keep full dataset; filter client-side for table display
  const [allRows, setAllRows] = useState<SinhVienQuanLyDangKyUngTuyenRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      // Always fetch all so we can compute stats regardless of current filter
      const url = buildSinhVienQuanLyDangKyUngTuyenListUrl("all");
      const cacheKey = `sv:ql-ung-tuyen:list:${url}`;
      if (!silent && (force || !hasCachedValue(cacheKey))) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT);
          return payload;
        },
        { force }
      );
      setAllRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(applicationId: string, action: RespondAction) {
    setBusyId(applicationId);
    try {
      const res = await fetch(buildSinhVienQuanLyDangKyUngTuyenRespondEndpoint(applicationId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(
          data?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT
        );
      setToast(data?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_SUCCESS_DEFAULT);
      await load({ force: true });
    } catch (e: unknown) {
      setToast(
        e instanceof Error
          ? e.message
          : SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT
      );
    } finally {
      setBusyId(null);
    }
  }

  const stats = computeStats(allRows);

  // Client-side filter for table
  const displayRows =
    statusFilter === "all"
      ? allRows
      : allRows.filter((r) => r.status === statusFilter);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý đăng ký ứng tuyển</h1>
        <p className={styles.subtitle}>Theo dõi toàn bộ hồ sơ đã nộp và trạng thái phản hồi.</p>
      </header>

      {/* Stat cards */}
      {!loading && (
        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.count}</p>
            </div>
          ))}
        </div>
      )}

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <QuanLyUngTuyenToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSearch={() => void load({ force: true })}
      />

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <QuanLyUngTuyenTableSection
          rows={displayRows}
          busyId={busyId}
          onRespond={(id, action) => void respond(id, action)}
        />
      )}

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}
