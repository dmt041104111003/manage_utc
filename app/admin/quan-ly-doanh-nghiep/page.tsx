"use client";

import { EnterpriseStatus } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AdminEnterpriseDetail, AdminEnterpriseListItem } from "@/lib/types/admin";
import {
  ADMIN_ENTERPRISE_MSG,
  buildApproveEnterpriseConfirmMessage,
  buildDeleteEnterpriseConfirmMessage,
  buildRejectEnterpriseStartConfirmMessage
} from "@/lib/constants/admin-enterprise";
import { ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT } from "@/hooks/useAdminPendingEnterpriseCount";
import { buildEnterpriseHeadquartersAddress, normalizeEnterpriseStatus } from "@/lib/utils/enterprise-admin-display";
import { companyTaxLabel } from "@/lib/utils/admin-enterprise-display";
import { ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE } from "@/lib/constants/admin-quan-ly-doanh-nghiep";
import {
  buildAdminEnterprisesListQueryParams,
  parseAdminEnterprisesStatusQueryParam
} from "@/lib/utils/admin-quan-ly-doanh-nghiep";
import MessagePopup from "../../components/MessagePopup";
import Pagination from "../../components/Pagination";
import styles from "../styles/dashboard.module.css";
import AdminEnterpriseToolbar from "./components/AdminEnterpriseToolbar";
import AdminEnterpriseTable from "./components/AdminEnterpriseTable";
const AdminEnterpriseStatusPopup = dynamic(() => import("./components/AdminEnterpriseStatusPopup"), { ssr: false });
const AdminEnterpriseViewPopup = dynamic(() => import("./components/AdminEnterpriseViewPopup"), { ssr: false });

export default function AdminQuanLyDoanhNghiepPage() {
  const [items, setItems] = useState<AdminEnterpriseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [enterpriseStatusStats, setEnterpriseStatusStats] = useState<{
    pending: number;
    approved: number;
    rejected: number;
  } | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchStatus, setSearchStatus] = useState<string>("all");
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const urlSynced = useRef(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [viewDetail, setViewDetail] = useState<AdminEnterpriseDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [statusTarget, setStatusTarget] = useState<AdminEnterpriseListItem | null>(null);
  const [statusDetail, setStatusDetail] = useState<AdminEnterpriseDetail | null>(null);
  const [rejectText, setRejectText] = useState("");
  const [rejectTextError, setRejectTextError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const closeStatusModal = () => {
    setStatusTarget(null);
    setStatusDetail(null);
    setRejectOpen(false);
    setRejectText("");
    setRejectTextError("");
  };

  const openStatusModal = (row: AdminEnterpriseListItem) => {
    setStatusTarget(row);
    setStatusDetail(null);
    setRejectOpen(false);
    setRejectText("");
    setRejectTextError("");
    void (async () => {
      const res = await fetch(`/api/admin/enterprises/${row.id}`);
      const data = await res.json();
      if (res.ok) setStatusDetail(data.item as AdminEnterpriseDetail);
    })();
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildAdminEnterprisesListQueryParams(appliedQ, appliedStatus);
      const res = await fetch(`/api/admin/enterprises?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data.message || ADMIN_ENTERPRISE_MSG.listLoadFail);
      setItems(data.items as AdminEnterpriseListItem[]);
      setEnterpriseStatusStats(data.enterpriseStatusStats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : ADMIN_ENTERPRISE_MSG.genericError);
      setItems([]);
      setEnterpriseStatusStats(null);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, appliedStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (urlSynced.current || typeof window === "undefined") return;
    urlSynced.current = true;
    const st = new URLSearchParams(window.location.search).get("status");
    const parsed = parseAdminEnterprisesStatusQueryParam(st);
    if (parsed) {
      setSearchStatus(parsed);
      setAppliedStatus(parsed);
    }
  }, []);

  const openView = async (row: AdminEnterpriseListItem) => {
    setViewDetail(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${row.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || ADMIN_ENTERPRISE_MSG.detailLoadFail);
      setViewDetail(data.item as AdminEnterpriseDetail);
    } catch (e) {
      setToast(e instanceof Error ? e.message : ADMIN_ENTERPRISE_MSG.detailLoadError);
    } finally {
      setViewLoading(false);
    }
  };

  const applySearch = () => {
    setAppliedQ(searchQ);
    setAppliedStatus(searchStatus);
    setPage(1);
  };

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE + ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE
  );

  const dismissToast = () => setToast("");

  const deleteEnterprise = async (row: AdminEnterpriseListItem) => {
    const name = row.companyName || "—";
    const tax = row.taxCode || "—";
    if (!window.confirm(buildDeleteEnterpriseConfirmMessage(name, tax))) {
      return;
    }

    setBusyId(row.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/enterprises/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.message || ADMIN_ENTERPRISE_MSG.deleteFail);
        return;
      }
      setToast(String(data.message));
      await load();
      window.dispatchEvent(new Event(ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT));
    } catch {
      setToast(ADMIN_ENTERPRISE_MSG.serverUnreachable);
    } finally {
      setBusyId(null);
    }
  };

  const approveRow = (row: AdminEnterpriseListItem) => {
    const label = companyTaxLabel(row);
    if (!window.confirm(buildApproveEnterpriseConfirmMessage(label))) return;
    void (async () => {
      setBusyId(row.id);
      setToast("");
      try {
        const res = await fetch(`/api/admin/enterprises/${row.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || ADMIN_ENTERPRISE_MSG.approveFail);
        setToast(String(data.message));
        if (statusTarget?.id === row.id) closeStatusModal();
        await load();
        window.dispatchEvent(new Event(ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT));
      } catch (e) {
        setToast(e instanceof Error ? e.message : ADMIN_ENTERPRISE_MSG.genericError);
      } finally {
        setBusyId(null);
      }
    })();
  };

  const submitApprove = () => {
    if (!statusTarget) return;
    approveRow(statusTarget);
  };

  const startReject = () => {
    if (!statusTarget) return;
    const label = companyTaxLabel(statusTarget);
    if (!window.confirm(buildRejectEnterpriseStartConfirmMessage(label))) return;
    setRejectOpen(true);
    setRejectText("");
    setRejectTextError("");
  };

  const submitReject = async () => {
    if (!statusTarget) return;
    setRejectTextError("");
    const reasons = rejectText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!reasons.length) {
      setRejectTextError(ADMIN_ENTERPRISE_MSG.rejectReasonRequired);
      return;
    }
    setBusyId(statusTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/enterprises/${statusTarget.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reasons })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || ADMIN_ENTERPRISE_MSG.rejectFail);
      setToast(String(data.message));
      closeStatusModal();
      await load();
      window.dispatchEvent(new Event(ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT));
    } catch (e) {
      const msg = e instanceof Error ? e.message : ADMIN_ENTERPRISE_MSG.genericError;
      setToast(msg);
      if (typeof msg === "string") setRejectTextError(msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý doanh nghiệp</h1>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {!loading && enterpriseStatusStats ? (
        <section aria-label="Thống kê trạng thái doanh nghiệp" style={{ marginBottom: 8 }}>
          <div className={styles.statsGrid3}>
            <div className={`${styles.statCard} ${styles.statCardTintPending}`}>
              <p className={styles.statLabel}>DN chờ phê duyệt</p>
              <p className={styles.statValue}>{enterpriseStatusStats.pending}</p>
            </div>
            <div className={`${styles.statCard} ${styles.statCardTintApproved}`}>
              <p className={styles.statLabel}>DN đã phê duyệt</p>
              <p className={styles.statValue}>{enterpriseStatusStats.approved}</p>
            </div>
            <div className={`${styles.statCard} ${styles.statCardTintRejected}`}>
              <p className={styles.statLabel}>DN bị từ chối</p>
              <p className={styles.statValue}>{enterpriseStatusStats.rejected}</p>
            </div>
          </div>
        </section>
      ) : null}

      <AdminEnterpriseToolbar
        searchQ={searchQ}
        searchStatus={searchStatus}
        onChangeSearchQ={setSearchQ}
        onChangeSearchStatus={setSearchStatus}
        onSearch={applySearch}
      />

      {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error ? (
        <AdminEnterpriseTable
          items={items}
          page={page}
          busyId={busyId}
          onView={(row) => void openView(row)}
          onDelete={(row) => void deleteEnterprise(row)}
          onOpenStatus={(row) => openStatusModal(row)}
        />
      ) : null}

      {!loading && !error ? (
        <Pagination
          page={page}
          pageSize={ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE}
          totalItems={items.length}
          onPageChange={setPage}
          buttonClassName={styles.btn}
        />
      ) : null}

      <AdminEnterpriseViewPopup
        viewLoading={viewLoading}
        viewDetail={viewDetail}
        onClose={() => {
          setViewDetail(null);
          setViewLoading(false);
        }}
      />

      <AdminEnterpriseStatusPopup
        statusTarget={statusTarget}
        statusDetail={statusDetail}
        rejectOpen={rejectOpen}
        rejectText={rejectText}
        rejectTextError={rejectTextError}
        busyId={busyId}
        onClose={closeStatusModal}
        onStartReject={startReject}
        onSubmitApprove={submitApprove}
        onSubmitReject={() => void submitReject()}
        onChangeRejectText={setRejectText}
        onBackFromReject={() => {
          setRejectOpen(false);
          setRejectText("");
        }}
      />
    </main>
  );
}
