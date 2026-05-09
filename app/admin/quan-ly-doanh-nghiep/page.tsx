"use client";

import { EnterpriseStatus } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { EnterpriseStatusCell } from "../components/EnterpriseStatusCell";
import { EnterpriseViewDetailTable } from "../components/EnterpriseViewDetailTable";
import MessagePopup from "../../components/MessagePopup";
import styles from "../styles/dashboard.module.css";

export default function AdminQuanLyDoanhNghiepPage() {
  const [items, setItems] = useState<AdminEnterpriseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [searchStatus, setSearchStatus] = useState<string>("all");
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const urlSynced = useRef(false);

  const [busyId, setBusyId] = useState<string | null>(null);

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
      const params = new URLSearchParams();
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      if (appliedStatus !== "all") params.set("status", appliedStatus);
      const res = await fetch(`/api/admin/enterprises?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || ADMIN_ENTERPRISE_MSG.listLoadFail);
      setItems(data.items as AdminEnterpriseListItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : ADMIN_ENTERPRISE_MSG.genericError);
      setItems([]);
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
    if (
      st === EnterpriseStatus.PENDING ||
      st === EnterpriseStatus.APPROVED ||
      st === EnterpriseStatus.REJECTED
    ) {
      setSearchStatus(st);
      setAppliedStatus(st);
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
  };

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

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label htmlFor="admin-dn-q">Tìm theo tên / MST</label>
          <input
            id="admin-dn-q"
            className={styles.textInputSearch}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Tên doanh nghiệp hoặc mã số thuế"
          />
        </div>
        <div className={styles.searchField}>
          <label htmlFor="admin-dn-status">Trạng thái</label>
          <select
            id="admin-dn-status"
            className={styles.selectInput}
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value={EnterpriseStatus.PENDING}>Chờ phê duyệt</option>
            <option value={EnterpriseStatus.APPROVED}>Đã phê duyệt</option>
            <option value={EnterpriseStatus.REJECTED}>Từ chối</option>
          </select>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => applySearch()}>
          Tìm kiếm
        </button>
      </div>

      {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error ? (
        <div className={`${styles.tableWrap} data-table-responsive-wrap`}>
          <table className={`${styles.dataTable} data-table-responsive`}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên doanh nghiệp</th>
                <th>Mã số thuế</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.modulePlaceholder}>
                    Không có doanh nghiệp phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{idx + 1}</td>
                    <td data-label="Tên doanh nghiệp">{row.companyName || "—"}</td>
                    <td data-label="MST">{row.taxCode || "—"}</td>
                    <td data-label="Trạng thái">
                      <EnterpriseStatusCell status={row.enterpriseStatus} />
                    </td>
                    <td data-label="Thao tác">
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => void openView(row)}
                      >
                        Xem
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => void deleteEnterprise(row)}
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => openStatusModal(row)}
                      >
                        Cập nhật trạng thái phê duyệt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {viewDetail || viewLoading ? (
        <MessagePopup open title="Xem thông tin doanh nghiệp" size="extraWide">
          {viewLoading ? <p>Đang tải…</p> : null}
          {!viewLoading && viewDetail ? <EnterpriseViewDetailTable item={viewDetail} /> : null}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => {
                setViewDetail(null);
                setViewLoading(false);
              }}
            >
              Đóng
            </button>
          </div>
        </MessagePopup>
      ) : null}

      {statusTarget ? (
        <MessagePopup open title="Cập nhật trạng thái phê duyệt" size="wide">
          {!rejectOpen ? (
            <>
              <div className={styles.statusCurrentRow}>
                <strong>Trạng thái hiện tại:</strong> <EnterpriseStatusCell status={statusTarget.enterpriseStatus} />
              </div>
              <p>
                <strong>Tên doanh nghiệp:</strong> {statusTarget.companyName || "—"}
                <br />
                <strong>Mã số thuế:</strong> {statusTarget.taxCode || "—"}
                <br />
                <strong>Email:</strong> {statusTarget.email}
                <br />
                <strong>Địa chỉ:</strong>{" "}
                {statusDetail ? buildEnterpriseHeadquartersAddress(statusDetail.enterpriseMeta) : "Đang tải…"}
              </p>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btn} onClick={closeStatusModal}>
                  Đóng
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  disabled={
                    busyId !== null ||
                    normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.REJECTED
                  }
                  title={
                    normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.REJECTED
                      ? "Hồ sơ đã bị từ chối — không thể từ chối thêm lần nữa."
                      : undefined
                  }
                  onClick={startReject}
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={
                    busyId !== null ||
                    normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.APPROVED
                  }
                  title={
                    normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.APPROVED
                      ? "Hồ sơ đã được phê duyệt — không cần phê duyệt lại."
                      : undefined
                  }
                  onClick={submitApprove}
                >
                  Phê duyệt
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Từ chối:</strong> {statusTarget.companyName || "—"} — MST {statusTarget.taxCode || "—"}
              </p>
              <p>Lý do từ chối (mỗi dòng một ý, hiển thị trong email).</p>
              <textarea
                value={rejectText}
                disabled={busyId !== null}
                onChange={(e) => setRejectText(e.target.value)}
                placeholder="Ví dụ: Hồ sơ chưa đầy đủ."
              />
              {rejectTextError ? (
                <p className={styles.error} style={{ marginTop: 6 }}>
                  {rejectTextError}
                </p>
              ) : null}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectText("");
                  }}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  disabled={busyId !== null}
                  onClick={() => void submitReject()}
                >
                  Gửi từ chối
                </button>
              </div>
            </>
          )}
        </MessagePopup>
      ) : null}
    </main>
  );
}
