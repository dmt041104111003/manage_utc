"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { ApiResponse, InternshipBatchRow, JobDetailResponse, JobListItem, StatusAction } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import { inferDefaultAction } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";
import { deleteCacheByPrefix, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminTinTuyenDungToolbar from "./components/AdminTinTuyenDungToolbar";
import AdminTinTuyenDungTableSection from "./components/AdminTinTuyenDungTableSection";
const AdminTinTuyenDungViewPopup = dynamic(() => import("./components/AdminTinTuyenDungViewPopup"), { ssr: false });
const AdminTinTuyenDungStatusPopup = dynamic(() => import("./components/AdminTinTuyenDungStatusPopup"), { ssr: false });
const AdminTinTuyenDungDeletePopup = dynamic(() => import("./components/AdminTinTuyenDungDeletePopup"), { ssr: false });

export default function AdminQuanLyTinTuyenDungPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [items, setItems] = useState<JobListItem[]>([]);
  const [statusStats, setStatusStats] = useState<{ pending: number; rejected: number; active: number; stopped: number } | null>(null);

  const [batches, setBatches] = useState<InternshipBatchRow[]>([]);
  const [expertises, setExpertises] = useState<string[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchBatchId, setSearchBatchId] = useState<string>("all");
  const [searchExpertise, setSearchExpertise] = useState<string>("all");
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

  const fetchJobDetailCached = async (id: string, force = false) =>
    getOrFetchCached<any>(
      `admin:job-posts:detail:${id}`,
      async () => {
        const res = await fetch(`/api/admin/job-posts/${id}`);
        const payload = (await res.json()) as ApiResponse<JobDetailResponse>;
        if (!res.ok || !payload.success || !payload.item) throw new Error(payload.message || "Không tải được chi tiết tin.");
        return payload;
      },
      { force }
    );

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
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (searchBatchId !== "all") params.set("batchId", searchBatchId);
      if (searchExpertise !== "all") params.set("expertise", searchExpertise);
      if (searchStatus !== "all") params.set("status", searchStatus);
      const url = `/api/admin/job-posts?${params.toString()}`;
      const cacheKey = `admin:job-posts:list:${url}`;
      if (!hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      setPage(1);
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = (await res.json()) as ApiResponse<JobListItem> & { expertises?: string[] };
          if (!res.ok || !payload.success) throw new Error(payload.message || "Không tải được danh sách tin.");
          return payload;
        }
      );
      setItems((data.items || []) as any);
      if (Array.isArray(data.expertises)) setExpertises(data.expertises);
      setStatusStats((data as any).statusStats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setStatusStats(null);
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

  useEffect(() => {
    if (!items.length) return;
    void Promise.allSettled(items.map((row) => fetchJobDetailCached(row.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const dismissToast = () => setToast("");

  const openView = async (row: JobListItem) => {
    setViewTarget(row);
    setViewDetail(null);
    setViewLoading(true);
    try {
      const data = await fetchJobDetailCached(row.id);
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
      deleteCacheByPrefix("admin:job-posts:");
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
      deleteCacheByPrefix("admin:job-posts:");
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

      {!loading && statusStats ? (
        <section aria-label="Thống kê trạng thái tin tuyển dụng">
          <div className={styles.statsGrid4}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Chờ duyệt</p>
              <p className={styles.statValue}>{statusStats.pending}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Từ chối duyệt</p>
              <p className={styles.statValue}>{statusStats.rejected}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Đang hoạt động</p>
              <p className={styles.statValue}>{statusStats.active}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Dừng hoạt động</p>
              <p className={styles.statValue}>{statusStats.stopped}</p>
            </div>
          </div>
        </section>
      ) : null}

      <AdminTinTuyenDungToolbar
        searchQ={searchQ}
        searchBatchId={searchBatchId}
        searchExpertise={searchExpertise}
        searchStatus={searchStatus}
        batches={batches}
        expertises={expertises}
        loadingBatches={loadingBatches}
        onChangeSearchQ={setSearchQ}
        onChangeSearchBatchId={setSearchBatchId}
        onChangeSearchExpertise={setSearchExpertise}
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
