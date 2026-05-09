"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { AccountRow, AccountStatus, Role } from "@/lib/types/admin-quan-ly-tai-khoan";
import { roleLabel } from "@/lib/constants/admin-quan-ly-tai-khoan";

import AdminTaiKhoanToolbar from "./components/AdminTaiKhoanToolbar";
import AdminTaiKhoanTableSection from "./components/AdminTaiKhoanTableSection";
import AdminTaiKhoanViewPopup from "./components/AdminTaiKhoanViewPopup";
import AdminTaiKhoanStatusPopup from "./components/AdminTaiKhoanStatusPopup";
import AdminTaiKhoanDeletePopup from "./components/AdminTaiKhoanDeletePopup";

export default function AdminQuanLyTaiKhoanPage() {
  const [items, setItems] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const load = async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (filterRole !== "all") params.set("role", filterRole);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/accounts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách tài khoản.");
      setItems((data.items || []) as AccountRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const openView = async (row: AccountRow) => {
    try {
      const res = await fetch(`/api/admin/accounts/${row.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được thông tin tài khoản.");
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
      await load();
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
      await load();
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

      <AdminTaiKhoanToolbar
        searchQ={searchQ}
        filterRole={filterRole}
        filterStatus={filterStatus}
        onChangeSearchQ={setSearchQ}
        onChangeFilterRole={setFilterRole}
        onChangeFilterStatus={setFilterStatus}
        onSearch={() => void load()}
      />

      <AdminTaiKhoanTableSection
        loading={loading}
        items={items}
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

