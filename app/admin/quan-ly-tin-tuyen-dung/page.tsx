"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import { DashboardStatSummaryCard } from "@/app/components/DashboardStatSummaryCard";
import MessagePopup from "../../components/MessagePopup";
import { FiClock, FiPauseCircle, FiXCircle, FiZap } from "react-icons/fi";

import type { ApiResponse, InternshipBatchRow, JobDetailResponse, JobListItem, StatusAction } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import { inferDefaultAction } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";
import { deleteCacheByPrefix, getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminTinTuyenDungToolbar from "./components/AdminTinTuyenDungToolbar";
import AdminTinTuyenDungTableSection from "./components/AdminTinTuyenDungTableSection";
const AdminTinTuyenDungViewPopup = dynamic(() => import("./components/AdminTinTuyenDungViewPopup"), { ssr: false });
const AdminTinTuyenDungStatusPopup = dynamic(() => import("./components/AdminTinTuyenDungStatusPopup"), { ssr: false });
const AdminTinTuyenDungDeletePopup = dynamic(() => import("./components/AdminTinTuyenDungDeletePopup"), { ssr: false });

function jobPostsListCacheKey(
  q: string,
  batchId: string,
  faculty: string,
  status: string
) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (batchId !== "all") params.set("batchId", batchId);
  if (faculty !== "all") params.set("expertise", faculty);
  if (status !== "all") params.set("status", status);
  return `admin:job-posts:list:/api/admin/job-posts?${params.toString()}`;
}

const JOB_POSTS_LIST_INITIAL_KEY = jobPostsListCacheKey("", "all", "all", "all");
const ADMIN_INTERNSHIP_BATCHES_ALL_CACHE_KEY = "admin:internship-batches:list:status=all";

function readJobPostsListFromCache(key: string) {
  const data = getCachedValue<{
    items?: JobListItem[];
    expertises?: string[];
    statusStats?: { pending: number; rejected: number; active: number; stopped: number } | null;
  }>(key);
  return {
    items: (Array.isArray(data?.items) ? data.items : []) as JobListItem[],
    expertises: Array.isArray(data?.expertises) ? data.expertises : [],
    statusStats: (data as { statusStats?: { pending: number; rejected: number; active: number; stopped: number } | null })?.statusStats ?? null
  };
}

export default function AdminQuanLyTinTuyenDungPage() {
  const seeded = readJobPostsListFromCache(JOB_POSTS_LIST_INITIAL_KEY);
  const [loading, setLoading] = useState(() => !hasCachedValue(JOB_POSTS_LIST_INITIAL_KEY));
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [items, setItems] = useState<JobListItem[]>(seeded.items);
  const [statusStats, setStatusStats] = useState<{ pending: number; rejected: number; active: number; stopped: number } | null>(seeded.statusStats);

  const [batches, setBatches] = useState<InternshipBatchRow[]>([]);
  const [faculties, setFaculties] = useState<string[]>(seeded.expertises);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchBatchId, setSearchBatchId] = useState<string>("all");
  const [searchFaculty, setSearchFaculty] = useState<string>("all");
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

  const loadBatches = async (opts?: { force?: boolean }) => {
    const force = Boolean(opts?.force);
    setLoadingBatches(true);
    try {
      const data = await getOrFetchCached<ApiResponse<InternshipBatchRow> & { items?: InternshipBatchRow[] }>(
        ADMIN_INTERNSHIP_BATCHES_ALL_CACHE_KEY,
        async () => {
          const res = await fetch("/api/admin/internship-batches?status=all");
          const json = (await res.json()) as ApiResponse<InternshipBatchRow>;
          if (!res.ok || !json.success) throw new Error(json.message || "Lỗi tải đợt thực tập.");
          return json;
        },
        { force }
      );
      setBatches((data.items || []) as any);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi tải đợt thực tập.");
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const load = async (opts?: { force?: boolean; silent?: boolean }) => {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (searchBatchId !== "all") params.set("batchId", searchBatchId);
      if (searchFaculty !== "all") params.set("expertise", searchFaculty);
      if (searchStatus !== "all") params.set("status", searchStatus);
      const url = `/api/admin/job-posts?${params.toString()}`;
      const cacheKey = jobPostsListCacheKey(searchQ, searchBatchId, searchFaculty, searchStatus);
      if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      setPage(1);
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = (await res.json()) as ApiResponse<JobListItem> & { expertises?: string[] };
          if (!res.ok || !payload.success) throw new Error(payload.message || "Không tải được danh sách tin.");
          return payload;
        },
        { force }
      );
      setItems((data.items || []) as any);
      if (Array.isArray(data.expertises)) setFaculties(data.expertises);
      setStatusStats((data as any).statusStats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setStatusStats(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadBatches(), load()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadBatches({ force: true });
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ, searchBatchId, searchFaculty, searchStatus]);

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
      await load({ force: true });
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
      await load({ force: true });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const search = async () => {
    setPage(1);
    await load({ force: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tin tuyển dụng thực tập</h1>
        <p className={styles.subtitle}>Danh sách tin tuyển dụng của doanh nghiệp, có duyệt/từ chối và xóa theo điều kiện liên kết.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {statusStats ? (
        <section aria-label="Thống kê trạng thái tin tuyển dụng">
          <div className={styles.statsGrid4}>
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Chờ duyệt"
              value={statusStats.pending}
              Icon={FiClock}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Từ chối duyệt"
              value={statusStats.rejected}
              Icon={FiXCircle}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Đang hoạt động"
              value={statusStats.active}
              Icon={FiZap}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Dừng hoạt động"
              value={statusStats.stopped}
              Icon={FiPauseCircle}
            />
          </div>
        </section>
      ) : null}

      <AdminTinTuyenDungToolbar
        searchQ={searchQ}
        searchBatchId={searchBatchId}
        searchExpertise={searchFaculty}
        searchStatus={searchStatus}
        batches={batches}
        expertises={faculties}
        loadingBatches={loadingBatches}
        onChangeSearchQ={setSearchQ}
        onChangeSearchBatchId={setSearchBatchId}
        onChangeSearchExpertise={setSearchFaculty}
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
