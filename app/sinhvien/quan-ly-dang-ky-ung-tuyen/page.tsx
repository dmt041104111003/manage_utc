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
import QuanLyUngTuyenToolbar from "./components/QuanLyUngTuyenToolbar";
import QuanLyUngTuyenTableSection from "./components/QuanLyUngTuyenTableSection";

export default function SinhVienQuanLyUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SinhVienQuanLyDangKyUngTuyenRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildSinhVienQuanLyDangKyUngTuyenListUrl(statusFilter));
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT);
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT);
      setToast(data?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_SUCCESS_DEFAULT);
      await load();
    } catch (e: any) {
      setToast(e?.message || SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý đăng ký ứng tuyển</h1>
        <p className={styles.subtitle}>Theo dõi toàn bộ hồ sơ đã nộp và trạng thái phản hồi.</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <QuanLyUngTuyenToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSearch={() => void load()}
      />

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <QuanLyUngTuyenTableSection
          rows={rows}
          busyId={busyId}
          onRespond={(id, action) => void respond(id, action)}
        />
      )}
      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

