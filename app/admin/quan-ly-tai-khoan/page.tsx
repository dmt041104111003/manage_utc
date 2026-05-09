"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import { DashboardStatSummaryCard } from "@/app/components/DashboardStatSummaryCard";
import MessagePopup from "../../components/MessagePopup";
import { FiPauseCircle, FiUserCheck } from "react-icons/fi";

import type { AccountRow, AccountStatus, Role } from "@/lib/types/admin-quan-ly-tai-khoan";
import { ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE, roleLabel } from "@/lib/constants/admin-quan-ly-tai-khoan";
import { deleteCacheByPrefix, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminTaiKhoanToolbar from "./components/AdminTaiKhoanToolbar";
import AdminTaiKhoanTableSection from "./components/AdminTaiKhoanTableSection";
const AdminTaiKhoanViewPopup = dynamic(() => import("./components/AdminTaiKhoanViewPopup"), { ssr: false });
const AdminTaiKhoanStatusPopup = dynamic(() => import("./components/AdminTaiKhoanStatusPopup"), { ssr: false });
const AdminTaiKhoanDeletePopup = dynamic(() => import("./components/AdminTaiKhoanDeletePopup"), { ssr: false });

export default function AdminQuanLyTaiKhoanPage() {
  const [items, setItems] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestBatchAccountStats, setLatestBatchAccountStats] = useState<{
    batchId: string | null;
    batchName: string | null;
    active: number;
    stopped: number;
  } | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "all">("all");

  const [toast, setToast] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<AccountRow | null>(null);
  const [statusDraft, setStatusDraft] = useState<AccountStatus>("ACTIVE");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAccountDetailCached = async (id: string, force = false) =>
    getOrFetchCached<any>(
      `admin:accounts:detail:${id}`,
      async () => {
        const res = await fetch(`/api/admin/accounts/${id}`);
        const payload = await res.json();
        if (!res.ok || !payload.success) throw new Error(payload.message || "Không tải được thông tin tài khoản.");
        return payload;
      },
      { force }
    );

  const load = async (opts?: { force?: boolean; silent?: boolean; targetPage?: number }) => {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    const targetPage = opts?.targetPage ?? page;
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (filterRole !== "all") params.set("role", filterRole);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("page", String(targetPage));
      params.set("pageSize", String(ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE));
      const url = `/api/admin/accounts?${params.toString()}`;
      const cacheKey = `admin:accounts:list:${url}`;
      if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok || !payload.success) throw new Error(payload.message || "Không tải được danh sách tài khoản.");
          return payload;
        },
        { force }
      );
      setItems((data.items || []) as AccountRow[]);
      setLatestBatchAccountStats(data.latestBatchAccountStats ?? null);
      setTotalItems(Number(data.totalItems || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setLatestBatchAccountStats(null);
      setTotalItems(0);
    } finally {
      if (!silent) setLoading(false);
    }
  };
  useEffect(() => {
    void load({ targetPage: page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true, targetPage: page });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ, filterRole, filterStatus, page]);

  useEffect(() => {
    if (!items.length) return;
    void Promise.allSettled(items.map((row) => fetchAccountDetailCached(row.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const openView = async (row: AccountRow) => {
    try {
      const data = await fetchAccountDetailCached(row.id);
      setViewTarget(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không tải được thông tin tài khoản.");
    }
  };

  const openStatus = (row: AccountRow) => {
    setStatusTarget(row);
    setStatusDraft(row.status);
  };

  const submitStatus = async () => {
    if (!statusTarget) return;
    setBusyId(statusTarget.id);
    try {
      if (statusDraft === "STOPPED") {
        const ok = window.confirm(
          `Bạn có chắc chắn muốn dừng hoạt động của tài khoản ${roleLabel[statusTarget.role]} - ${statusTarget.fullName}-${statusTarget.email} không?`
        );
        if (!ok) return;
      }

      const res = await fetch(`/api/admin/accounts/${statusTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDraft })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      setToast(data.message || "Cập nhật trạng thái tài khoản thành công.");
      setStatusTarget(null);
      deleteCacheByPrefix("admin:accounts:");
      await load({ force: true, targetPage: page });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/accounts/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Xóa tài khoản thất bại.");
      setToast(data.message || "Xóa tài khoản thành công.");
      setDeleteTarget(null);
      deleteCacheByPrefix("admin:accounts:");
      await load({ force: true, targetPage: page });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa tài khoản thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tài khoản</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && latestBatchAccountStats?.batchId ? (
        <section aria-label="Thống kê tài khoản đợt mới nhất">
          <div className={styles.statusNote} style={{ marginBottom: 10 }}>
            Đợt thực tập mới nhất: <strong>{latestBatchAccountStats.batchName ?? "—"}</strong>
          </div>
          <div className={styles.statsGrid2}>
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Tài khoản đang hoạt động"
              value={latestBatchAccountStats.active}
              Icon={FiUserCheck}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Tài khoản dừng hoạt động"
              value={latestBatchAccountStats.stopped}
              Icon={FiPauseCircle}
            />
          </div>
        </section>
      ) : null}

      <AdminTaiKhoanToolbar
        searchQ={searchQ}
        filterRole={filterRole}
        filterStatus={filterStatus}
        onChangeSearchQ={setSearchQ}
        onChangeFilterRole={setFilterRole}
        onChangeFilterStatus={setFilterStatus}
        onSearch={() => {
          setPage(1);
          void load({ force: true, targetPage: 1 });
        }}
      />

      <AdminTaiKhoanTableSection
        loading={loading}
        items={items}
        totalItems={totalItems}
        page={page}
        busyId={busyId}
        onPageChange={setPage}
        onView={(row) => void openView(row)}
        onStatus={openStatus}
        onDelete={setDeleteTarget}
      />

      <AdminTaiKhoanViewPopup
        item={viewTarget}
        onClose={() => setViewTarget(null)}
      />

      <AdminTaiKhoanStatusPopup
        open={statusTarget !== null}
        statusDraft={statusDraft}
        busy={busyId !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => void submitStatus()}
        onChangeStatus={setStatusDraft}
      />

      <AdminTaiKhoanDeletePopup
        target={deleteTarget}
        busy={busyId !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void submitDelete()}
      />

      {toast ? <MessagePopup open title="Thông báo" message={toast} onClose={() => setToast(null)} /> : null}
    </main>
  );
}

