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
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_EMPTY_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERNSHIP_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERVIEW_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERNSHIP_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERVIEW_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_FIND_BUTTON_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_LOAD_ERROR_DEFAULT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_NETWORK_ERROR_DEFAULT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_RESPOND_SUCCESS_DEFAULT,
  sinhvienQuanLyDangKyUngTuyenResponseLabel,
  sinhvienQuanLyDangKyUngTuyenStatusLabel
} from "@/lib/constants/sinhvien-quan-ly-dang-ky-ung-tuyen";
import {
  buildSinhVienQuanLyDangKyUngTuyenRespondEndpoint,
  buildSinhVienQuanLyDangKyUngTuyenListUrl,
  formatDateVi,
  getSinhVienQuanLyDangKyUngTuyenResponseText,
  parseStatusFilterValue
} from "@/lib/utils/sinhvien-quan-ly-dang-ky-ung-tuyen";

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
      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField} style={{ maxWidth: 280 }}>
          <label>Trạng thái</label>
          <select
            className={adminStyles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(parseStatusFilterValue(e.target.value))}
          >
            <option value="all">Tất cả</option>
            <option value="PENDING_REVIEW">Chờ xem xét</option>
            <option value="INTERVIEW_INVITED">Mời phỏng vấn</option>
            <option value="OFFERED">Trúng tuyển</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void load()}>
          {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_FIND_BUTTON_TEXT}
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.dataTable}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tiêu đề</th>
                <th>Doanh nghiệp</th>
                <th>Chuyên môn</th>
                <th>Ngày ứng tuyển</th>
                <th>Trạng thái</th>
                <th>Phản hồi của SV</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.modulePlaceholder}>
                    {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_EMPTY_TEXT}
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <a className={adminStyles.detailLink} href={`/sinhvien/tra-cuu-ung-tuyen/${r.job.id}`}>
                        {r.job.title}
                      </a>
                    </td>
                    <td>{r.job.companyName}</td>
                    <td>{r.job.expertise}</td>
                    <td>{formatDateVi(r.appliedAt)}</td>
                    <td>{sinhvienQuanLyDangKyUngTuyenStatusLabel[r.status]}</td>
                    <td>
                      {getSinhVienQuanLyDangKyUngTuyenResponseText(r)}
                    </td>
                    <td>
                      {r.status === "INTERVIEW_INVITED" && r.response === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "CONFIRM_INTERVIEW")}
                          >
                            {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERVIEW_TEXT}
                          </button>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "DECLINE_INTERVIEW")}
                          >
                            {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERVIEW_TEXT}
                          </button>
                        </>
                      ) : null}
                      {r.status === "OFFERED" && r.response === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "CONFIRM_INTERNSHIP")}
                          >
                            {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERNSHIP_TEXT}
                          </button>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "DECLINE_INTERNSHIP")}
                          >
                            {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERNSHIP_TEXT}
                          </button>
                        </>
                      ) : null}
                      {r.status === "PENDING_REVIEW" || r.status === "REJECTED" || r.status === "STUDENT_DECLINED" || r.response !== "PENDING" ? "—" : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

