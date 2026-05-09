"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { ApiResponse, InternshipBatchRow, JobDetailResponse, JobListItem, StatusAction } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import { inferDefaultAction } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";

import AdminTinTuyenDungToolbar from "./components/AdminTinTuyenDungToolbar";
import AdminTinTuyenDungTableSection from "./components/AdminTinTuyenDungTableSection";
import AdminTinTuyenDungViewPopup from "./components/AdminTinTuyenDungViewPopup";
import AdminTinTuyenDungStatusPopup from "./components/AdminTinTuyenDungStatusPopup";
import AdminTinTuyenDungDeletePopup from "./components/AdminTinTuyenDungDeletePopup";

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tin tuyển dụng thực tập</h1>
        <p className={styles.subtitle}>Danh sách tin tuyển dụng của doanh nghiệp, có duyệt/từ chối và xóa theo điều kiện liên kết.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <AdminTinTuyenDungToolbar
        searchQ={searchQ}
        searchBatchId={searchBatchId}
        searchStatus={searchStatus}
        batches={batches}
        onChangeSearchQ={setSearchQ}
        onChangeSearchBatchId={setSearchBatchId}
        onChangeSearchStatus={setSearchStatus}
        onSearch={() => void search()}
      />

      <AdminTinTuyenDungTableSection
        loading={loading}
        items={items}
        page={page}
        busyId={busyId}
        onPageChange={setPage}
        onView={(row) => void openView(row)}
        onStatus={openStatus}
        onDelete={setDeleteTarget}
      />

      <AdminTinTuyenDungViewPopup
        viewTarget={viewTarget}
        viewLoading={viewLoading}
        viewDetail={viewDetail}
        onClose={() => setViewTarget(null)}
      />

      <AdminTinTuyenDungStatusPopup
        target={statusTarget}
        statusAction={statusAction}
        rejectReason={rejectReason}
        busy={busyId !== null}
        onClose={closeStatus}
        onSubmit={() => void submitStatus()}
        onChangeStatusAction={setStatusAction}
        onChangeRejectReason={setRejectReason}
      />

      <AdminTinTuyenDungDeletePopup
        target={deleteTarget}
        busy={busyId !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void submitDelete()}
      />
    </main>
  );
}

