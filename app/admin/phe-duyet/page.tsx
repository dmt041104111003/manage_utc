"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../styles/dashboard.module.css";
import { usePendingEnterprises } from "@/hooks/usePendingEnterprises";
import { IconCheck, IconX } from "../components/PheDuyetIcons";
import type { PendingEnterpriseItem } from "@/lib/types/admin";
import { formatEnterpriseMetaSummary } from "@/lib/utils/enterprise-meta";

export default function AdminPheDuyetPage() {
  const { items, loading, error, reload: load } = usePendingEnterprises();
  const [rejectFor, setRejectFor] = useState<PendingEnterpriseItem | null>(null);
  const [rejectText, setRejectText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const approve = async (row: PendingEnterpriseItem) => {
    setBusyId(row.id);
    setToast("");
    try {
      const res = await fetch("/api/admin/enterprise-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.id, action: "approve" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Phê duyệt thất bại.");
      setToast(
        data.mailError ? `${data.message} (Cảnh báo gửi email: ${data.mailError})` : String(data.message)
      );
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectFor) return;
    const reasons = rejectText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!reasons.length) {
      setToast("Nhập ít nhất một dòng lý do (mỗi dòng một lý do).");
      return;
    }
    setBusyId(rejectFor.id);
    setToast("");
    try {
      const res = await fetch("/api/admin/enterprise-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: rejectFor.id, action: "reject", reasons })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Từ chối thất bại.");
      setRejectFor(null);
      setRejectText("");
      setToast(
        data.mailError ? `${data.message} (Cảnh báo gửi email: ${data.mailError})` : String(data.message)
      );
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phê duyệt doanh nghiệp</h1>
        <p className={styles.subtitle}>
          Danh sách đăng ký chờ duyệt. Phê duyệt gửi email theo mẫu «thành công»; từ chối gửi email kèm lý do.
        </p>
      </header>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <div className={styles.pheDuyetBody}>
        {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className={styles.modulePlaceholder}>Không có hồ sơ chờ phê duyệt.</p>
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <div className={`${styles.tableWrap} data-table-responsive-wrap`}>
            <table className={`${styles.dataTable} data-table-responsive`}>
              <thead>
                <tr>
                  <th>Doanh nghiệp</th>
                  <th>MST</th>
                  <th>Người liên hệ</th>
                  <th>Địa chỉ / lĩnh vực</th>
                  <th>Ngày gửi</th>
                  <th>Chi tiết</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Doanh nghiệp">
                      <strong>{row.companyName || "—"}</strong>
                      <br />
                      <span style={{ color: "#6b7280" }}>{row.email}</span>
                    </td>
                    <td data-label="MST">{row.taxCode || "—"}</td>
                    <td data-label="Người liên hệ">
                      {row.fullName}
                      <br />
                      {row.phone || "—"}
                    </td>
                    <td data-label="Địa chỉ / lĩnh vực">{formatEnterpriseMetaSummary(row.enterpriseMeta)}</td>
                    <td data-label="Ngày gửi">{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                    <td data-label="Chi tiết">
                      <Link className={styles.detailLink} href={`/admin/phe-duyet/${row.id}`}>
                        Xem chi tiết
                      </Link>
                    </td>
                    <td data-label="Thao tác">
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconAction}
                          disabled={busyId !== null}
                          aria-label="Phê duyệt"
                          title="Phê duyệt"
                          onClick={() => approve(row)}
                        >
                          {busyId === row.id ? (
                            <span className={styles.iconActionBusy} aria-hidden>
                              …
                            </span>
                          ) : (
                            <IconCheck />
                          )}
                        </button>
                        <button
                          type="button"
                          className={styles.iconAction}
                          disabled={busyId !== null}
                          aria-label="Từ chối"
                          title="Từ chối"
                          onClick={() => {
                            setRejectFor(row);
                            setRejectText("");
                          }}
                        >
                          <IconX />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {rejectFor ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
        >
          <div className={styles.modal}>
            <h2 id="reject-title">Từ chối: {rejectFor.companyName}</h2>
            <p>Mỗi dòng là một lý do (hiển thị trong email tới doanh nghiệp).</p>
            <textarea
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Ví dụ: Giấy phép đính kèm không đọc được.&#10;Mã số thuế cần đối chiếu thêm."
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setRejectFor(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnReject}`}
                disabled={busyId !== null}
                onClick={() => void submitReject()}
              >
                Gửi từ chối
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
