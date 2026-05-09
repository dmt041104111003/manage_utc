"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

type AppStatus = "PENDING_REVIEW" | "INTERVIEW_INVITED" | "OFFERED" | "REJECTED" | "STUDENT_DECLINED";
type ResponseStatus = "PENDING" | "ACCEPTED" | "DECLINED";
type WorkType = "PART_TIME" | "FULL_TIME";
type Row = {
  id: string;
  status: AppStatus;
  response: ResponseStatus;
  appliedAt: string | null;
  interviewAt: string | null;
  responseAt: string | null;
  job: {
    id: string;
    title: string;
    expertise: string;
    workType: WorkType;
    deadlineAt: string | null;
    companyName: string;
  };
};

const statusLabel: Record<AppStatus, string> = {
  PENDING_REVIEW: "Chờ xem xét",
  INTERVIEW_INVITED: "Mời phỏng vấn",
  OFFERED: "Trúng tuyển",
  REJECTED: "Từ chối",
  STUDENT_DECLINED: "Từ chối"
};

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function SinhVienQuanLyUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | AppStatus | "REJECTED">("all");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`/api/sinhvien/ung-tuyen?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách ứng tuyển.");
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách ứng tuyển.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(applicationId: string, action: "CONFIRM_INTERVIEW" | "DECLINE_INTERVIEW" | "CONFIRM_INTERNSHIP" | "DECLINE_INTERNSHIP") {
    setBusyId(applicationId);
    try {
      const res = await fetch(`/api/sinhvien/ung-tuyen/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể cập nhật phản hồi.");
      setToast(data?.message || "Cập nhật phản hồi thành công.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Không thể cập nhật phản hồi.");
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
          <select className={adminStyles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="PENDING_REVIEW">Chờ xem xét</option>
            <option value="INTERVIEW_INVITED">Mời phỏng vấn</option>
            <option value="OFFERED">Trúng tuyển</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void load()}>
          Tìm kiếm
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
                    Bạn chưa ứng tuyển tin nào.
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
                    <td>{statusLabel[r.status]}</td>
                    <td>
                      {r.response === "ACCEPTED" ? "Đã xác nhận" : r.response === "DECLINED" ? "Đã từ chối" : "Chưa phản hồi"}
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
                            Xác nhận phỏng vấn
                          </button>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "DECLINE_INTERVIEW")}
                          >
                            Từ chối phỏng vấn
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
                            Xác nhận thực tập
                          </button>
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => void respond(r.id, "DECLINE_INTERNSHIP")}
                          >
                            Từ chối thực tập
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

