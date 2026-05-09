"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import Pagination from "../../components/Pagination";

import type { ApiResponse, InternshipBatchRow, JobDetailResponse, JobListItem, JobStatus, StatusAction, WorkType } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import {
  ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE,
  statusLabel,
  workTypeLabel
} from "@/lib/constants/admin-quan-ly-tin-tuyen-dung";
import { formatDateVi, inferDefaultAction } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";

export default function AdminQuanLyTinTuyenDungPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [items, setItems] = useState<JobListItem[]>([]);

  const [batches, setBatches] = useState<InternshipBatchRow[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchBatchId, setSearchBatchId] = useState<string>("all");
  const [searchStatus, setSearchStatus] = useState<string>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [viewTarget, setViewTarget] = useState<JobListItem | null>(null);
  const [viewDetail, setViewDetail] = useState<JobDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [statusTarget, setStatusTarget] = useState<JobListItem | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction>("approve");
  const [rejectReason, setRejectReason] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<JobListItem | null>(null);

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch("/api/admin/internship-batches?status=all");
      const data = (await res.json()) as ApiResponse<InternshipBatchRow>;
      if (!res.ok || !data.success) throw new Error(data.message || "Lỗi tải đợt thực tập.");
      setBatches((data.items || []) as any);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi tải đợt thực tập.");
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (searchBatchId !== "all") params.set("batchId", searchBatchId);
      if (searchStatus !== "all") params.set("status", searchStatus);
      const res = await fetch(`/api/admin/job-posts?${params.toString()}`);
      const data = (await res.json()) as ApiResponse<JobListItem>;
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách tin.");
      setItems((data.items || []) as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await loadBatches();
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissToast = () => setToast("");

  const openView = async (row: JobListItem) => {
    setViewTarget(row);
    setViewDetail(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/job-posts/${row.id}`);
      const data = (await res.json()) as ApiResponse<JobDetailResponse>;
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được chi tiết tin.");
      setViewDetail(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi tải chi tiết.");
    } finally {
      setViewLoading(false);
    }
  };

  const openStatus = (row: JobListItem) => {
    setStatusTarget(row);
    setRejectReason(row.rejectionReason || "");
    setStatusAction(inferDefaultAction(row.status));
  };

  const closeStatus = () => {
    setStatusTarget(null);
    setRejectReason("");
    setStatusAction("approve");
  };

  const submitStatus = async () => {
    if (!statusTarget) return;
    if (statusAction === "reject" && !rejectReason.trim()) {
      setToast("Lý do từ chối là bắt buộc.");
      return;
    }
    setBusyId(statusTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/job-posts/${statusTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: statusAction,
          rejectionReason: statusAction === "reject" ? rejectReason.trim() : undefined
        })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      setToast(data.message || "Cập nhật trạng thái thành công.");
      closeStatus();
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/job-posts/${deleteTarget.id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Xóa thất bại.");
      setToast(data.message || "Xóa tin tuyển dụng thành công");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const search = async () => {
    setPage(1);
    await load();
  };

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE + ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE
  );

  const viewOrLoading = viewTarget || viewLoading;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tin tuyển dụng thực tập</h1>
        <p className={styles.subtitle}>Danh sách tin tuyển dụng của doanh nghiệp, có duyệt/từ chối và xóa theo điều kiện liên kết.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label>Tên tiêu đề / Tên doanh nghiệp</label>
          <input className={styles.textInputSearch} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Nhập tên" />
        </div>
        <div className={styles.searchField}>
          <label>Đợt thực tập</label>
          <select className={styles.selectInput} value={searchBatchId} onChange={(e) => setSearchBatchId(e.target.value)}>
            <option value="all">Tất cả</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.semester} {b.schoolYear})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.searchField}>
          <label>Trạng thái</label>
          <select className={styles.selectInput} value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="REJECTED">Từ chối duyệt</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="STOPPED">Dừng hoạt động</option>
          </select>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void search()}>
          Tìm kiếm
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tiêu đề</th>
                <th>Tên doanh nghiệp</th>
                <th>Ngày đăng tin</th>
                <th>Đợt thực tập</th>
                <th>Trạng thái tin</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.modulePlaceholder}>
                    Không có tin tuyển dụng phù hợp.
                  </td>
                </tr>
              ) : (
                pagedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">
                      {(page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE + idx + 1}
                    </td>
                    <td data-label="Tiêu đề">{row.title}</td>
                    <td data-label="Tên doanh nghiệp">{row.enterpriseName || "—"}</td>
                    <td data-label="Ngày đăng tin">{formatDateVi(row.createdAt)}</td>
                    <td data-label="Đợt thực tập">{row.batchName || "—"}</td>
                    <td data-label="Trạng thái tin">{statusLabel[row.status]}</td>
                    <td data-label="Thao tác">
                      <div className={styles.rowActions} style={{ gap: 10 }}>
                        <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => void openView(row)}>
                          Xem
                        </button>
                        <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => openStatus(row)}>
                          Duyệt tin
                        </button>
                        <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => setDeleteTarget(row)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading ? (
        <Pagination
          page={page}
          pageSize={ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE}
          totalItems={items.length}
          onPageChange={setPage}
          buttonClassName={styles.btn}
          activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
        />
      ) : null}

      {/* Popup: Xem chi tiết tin tuyển dụng */}
      {viewOrLoading ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-view-title">
          <div className={`${styles.modal} ${styles.modalExtraWide}`}>
            <h2 id="job-view-title">Xem chi tiết tin tuyển dụng</h2>
            {viewLoading ? <p>Đang tải…</p> : null}
            {viewDetail ? (
              <div>
                <table className={styles.viewModalDetailTable}>
                  <tbody>
                    <tr>
                      <th scope="row">Tiêu đề</th>
                      <td style={{ fontWeight: 700 }}>{viewDetail.job.title}</td>
                    </tr>
                    <tr>
                      <th scope="row">Thông tin doanh nghiệp</th>
                      <td />
                    </tr>
                    <tr>
                      <th scope="row">Tên doanh nghiệp</th>
                      <td>{viewDetail.enterprise.companyName || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">MST</th>
                      <td>{viewDetail.enterprise.taxCode || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Lĩnh vực</th>
                      <td>{viewDetail.enterprise.businessFields || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Địa điểm trụ sở chính</th>
                      <td>{viewDetail.enterprise.headquartersAddress || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Giới thiệu về công ty</th>
                      <td>{viewDetail.job.companyIntro || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Website</th>
                      <td>
                        {viewDetail.job.companyWebsite ? (
                          <a href={viewDetail.job.companyWebsite} target="_blank" rel="noopener noreferrer">
                            {viewDetail.job.companyWebsite}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">Mức lương</th>
                      <td>{viewDetail.job.salary || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Chuyên môn</th>
                      <td>{viewDetail.job.expertise || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Yêu cầu kinh nghiệm</th>
                      <td>{viewDetail.job.experienceRequirement || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Số lượng tuyển dụng</th>
                      <td>{viewDetail.job.recruitmentCount}</td>
                    </tr>
                    <tr>
                      <th scope="row">Hình thức làm việc</th>
                      <td>{workTypeLabel[viewDetail.job.workType]}</td>
                    </tr>
                    <tr>
                      <th scope="row">Hạn tuyển dụng</th>
                      <td>{formatDateVi(viewDetail.job.deadlineAt)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Mô tả công việc</th>
                      <td>{viewDetail.job.jobDescription || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Yêu cầu ứng viên</th>
                      <td>{viewDetail.job.candidateRequirements || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Quyền lợi</th>
                      <td>{viewDetail.job.benefits || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Địa điểm làm việc</th>
                      <td>{viewDetail.job.workLocation || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Thời gian làm việc</th>
                      <td>{viewDetail.job.workTime || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Cách thức ứng tuyển</th>
                      <td>{viewDetail.job.applicationMethod || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Trạng thái hiện tại của tin</th>
                      <td>{statusLabel[viewDetail.job.status]}</td>
                    </tr>
                    {viewDetail.job.status === "REJECTED" ? (
                      <tr>
                        <th scope="row">Lý do từ chối</th>
                        <td>{viewDetail.job.rejectionReason || "—"}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setViewTarget(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Cập nhật trạng thái */}
      {statusTarget ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-status-title">
          <div className={`${styles.modal} ${styles.modalWide}`}>
            <h2 id="job-status-title">Cập nhật trạng thái</h2>
            <p style={{ marginTop: 0 }}>
              Tin: <strong>{statusTarget.title}</strong> - {statusTarget.enterpriseName || "—"}
            </p>
            <p style={{ marginTop: 0 }}>
              Trạng thái hiện tại: <strong>{statusLabel[statusTarget.status]}</strong>
            </p>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Trạng thái</label>
              <select
                className={styles.selectInput}
                value={statusAction}
                onChange={(e) => setStatusAction(e.target.value as any)}
                disabled={busyId !== null}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="approve">Duyệt tin</option>
                <option value="reject">Từ chối</option>
                <option value="stop">Đừng hoạt động</option>
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Lý do từ chối <span style={{ color: "#b91c1c" }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                disabled={statusAction !== "reject" || busyId !== null}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={statusAction === "reject" ? "Nhập lý do từ chối" : "Chỉ nhập khi chọn Từ chối"}
                style={{ width: "100%", marginTop: 6 }}
              />
              {statusAction === "reject" ? (
                <p className={styles.error} style={{ marginTop: 6 }}>
                  {rejectReason.trim() ? "" : "Lý do từ chối bắt buộc."}
                </p>
              ) : null}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => closeStatus()} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busyId !== null} onClick={() => void submitStatus()}>
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Xóa tin */}
      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-del-title">
          <div className={`${styles.modal} ${styles.modalWide}`}>
            <h2 id="job-del-title">Xóa tin</h2>
            <p>
              Bạn có chắc chắn muốn xóa tin tuyển dụng: <strong>{deleteTarget.title}</strong> - {deleteTarget.enterpriseName || "—"} - {deleteTarget.enterpriseTaxCode || "—"} không?
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setDeleteTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => void submitDelete()} disabled={busyId !== null}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

