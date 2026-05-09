"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FiLock, FiUnlock } from "react-icons/fi";
import { DashboardStatSummaryCard } from "@/app/components/DashboardStatSummaryCard";
import styles from "../styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";

import type { ApiResponse, BatchFormState, InternshipBatchRow, InternshipBatchStatus } from "@/lib/types/admin-quan-ly-dot-thuc-tap";
import {
  ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE,
  ADMIN_QUAN_LY_DOT_THUC_TAP_SEMESTER_OPTIONS,
  ADMIN_QUAN_LY_DOT_THUC_TAP_STATUS_LABEL
} from "@/lib/constants/admin-quan-ly-dot-thuc-tap";
import { buildEmptyBatchForm } from "@/lib/utils/admin-quan-ly-dot-thuc-tap-form";
import { formatDateVi, getTodayStart, parseDateOnly, todayDateInputValue } from "@/lib/utils/admin-quan-ly-dot-thuc-tap-dates";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminInternshipBatchToolbar from "./components/AdminInternshipBatchToolbar";
import AdminInternshipBatchTableSection from "./components/AdminInternshipBatchTableSection";
import AdminInternshipBatchEditModal from "./components/AdminInternshipBatchEditModal";
const AdminInternshipBatchDeletePopup = dynamic(() => import("./components/AdminInternshipBatchDeletePopup"), { ssr: false });
const AdminInternshipBatchStatusPopup = dynamic(() => import("./components/AdminInternshipBatchStatusPopup"), { ssr: false });
const AdminInternshipBatchViewPopup = dynamic(() => import("./components/AdminInternshipBatchViewPopup"), { ssr: false });

export default function AdminQuanLyDotThucTapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [items, setItems] = useState<InternshipBatchRow[]>([]);
  const [batchStatusStats, setBatchStatusStats] = useState<{ open: number; closed: number } | null>(null);

  const [searchName, setSearchName] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");
  const [searchStatus, setSearchStatus] = useState<"all" | InternshipBatchStatus>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [viewTarget, setViewTarget] = useState<InternshipBatchRow | null>(null);

  const [editTarget, setEditTarget] = useState<InternshipBatchRow | null>(null);
  const [form, setForm] = useState<BatchFormState>(() => buildEmptyBatchForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<InternshipBatchRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<InternshipBatchRow | null>(null);

  const syncFormFromTarget = (t: InternshipBatchRow) => {
    setFieldErrors({});
    setForm({
      name: t.name || "",
      semester: t.semester,
      schoolYear: t.schoolYear || "",
      startDate: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : todayDateInputValue(),
      endDate: t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : todayDateInputValue(),
      notes: t.notes || ""
    });
  };

  const load = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const params = new URLSearchParams();
      if (searchName.trim()) params.set("q", searchName.trim());
      if (searchStart) params.set("startDate", searchStart);
      if (searchEnd) params.set("endDate", searchEnd);
      if (searchStatus !== "all") params.set("status", searchStatus);
      const url = `/api/admin/internship-batches?${params.toString()}`;
      const cacheKey = `admin:internship-batches:list:${url}`;
      if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      setPage(1);
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = (await res.json()) as ApiResponse<InternshipBatchRow>;
          if (!res.ok || !payload.success) throw new Error(payload.message || "Không tải được danh sách đợt thực tập.");
          return payload;
        },
        { force }
      );
      setItems((data.items || []) as any);
      setBatchStatusStats((data as any).batchStatusStats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setBatchStatusStats(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [searchName, searchStart, searchEnd, searchStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const dismissToast = () => setToast("");

  const validateCreate = () => {
    const next: Record<string, string> = {};
    const name = form.name.trim();
    const semester = form.semester;
    const schoolYear = form.schoolYear.trim();
    const notes = form.notes.trim();

    if (!name || name.length < 1 || name.length > 255) next.name = "Tên đợt thực tập từ 1–255 ký tự.";
    if (!semester) next.semester = "Học kỳ bắt buộc.";
    if (!/^\d{4}-\d{4}$/.test(schoolYear)) next.schoolYear = "Năm học chỉ cho phép số, dấu '-' (ví dụ 2024-2025).";
    if (!form.startDate) next.startDate = "Thời gian bắt đầu bắt buộc.";
    if (!form.endDate) next.endDate = "Thời gian kết thúc bắt buộc.";

    if (form.startDate && form.endDate) {
      const start = parseDateOnly(form.startDate);
      const end = parseDateOnly(form.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (end.getTime() <= start.getTime()) next.endDate = "Thời gian kết thúc phải > thời gian bắt đầu.";
      if (end.getTime() <= today.getTime()) next.endDate = "Thời gian kết thúc phải > ngày hiện tại.";
    }

    if (!notes) next.notes = "Ghi chú bắt buộc.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateEdit = () => {
    // Cho phép endDate <= ngày hiện tại (tự động đóng)
    const next = {} as Record<string, string>;
    if (!form.name.trim() || form.name.trim().length < 1 || form.name.trim().length > 255) next.name = "Tên đợt thực tập từ 1–255 ký tự.";
    if (!form.semester) next.semester = "Học kỳ bắt buộc.";
    if (!/^\d{4}-\d{4}$/.test(form.schoolYear.trim())) next.schoolYear = "Năm học chỉ cho phép số, dấu '-' (ví dụ 2024-2025).";
    if (!form.startDate) next.startDate = "Thời gian bắt đầu bắt buộc.";
    if (!form.endDate) next.endDate = "Thời gian kết thúc bắt buộc.";
    if (form.startDate && form.endDate) {
      const start = parseDateOnly(form.startDate);
      const end = parseDateOnly(form.endDate);
      if (end.getTime() <= start.getTime()) next.endDate = "Thời gian kết thúc phải > thời gian bắt đầu.";
    }
    if (!form.notes.trim()) next.notes = "Ghi chú bắt buộc.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const startCreate = () => {
    setEditTarget(null);
    setFieldErrors({});
    setForm(buildEmptyBatchForm());
    setViewTarget(null);
    setDeleteTarget(null);
    setStatusTarget(null);
    // Use edit modal for create
    setEditTarget({
      id: "new",
      name: "",
      semester: "HK_I",
      schoolYear: "",
      startDate: todayDateInputValue(),
      endDate: todayDateInputValue(),
      status: "OPEN",
      notes: ""
    });
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setFieldErrors({});
  };

  const submitCreate = async () => {
    if (!validateCreate()) return;
    setBusyId("new");
    setToast("");
    try {
      const payload = {
        name: form.name.trim(),
        semester: form.semester,
        schoolYear: form.schoolYear.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim()
      };
      const res = await fetch("/api/admin/internship-batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) {
        const maybeErrors = (data as any)?.errors as Record<string, string> | undefined;
        if (maybeErrors && typeof maybeErrors === "object") {
          setFieldErrors(maybeErrors);
          return;
        }
        setToast(data.message || "Tạo đợt thực tập thất bại.");
        return;
      }
      setToast(data.message || "Tạo đợt thực tập thành công.");
      closeEditModal();
      await load({ force: true });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Tạo đợt thực tập thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!editTarget || editTarget.id === "new") return;
    if (!validateEdit()) return;
    setBusyId(editTarget.id);
    setToast("");
    try {
      const payload = {
        name: form.name.trim(),
        semester: form.semester,
        schoolYear: form.schoolYear.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim()
      };
      const res = await fetch(`/api/admin/internship-batches/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) {
        const maybeErrors = (data as any)?.errors as Record<string, string> | undefined;
        if (maybeErrors && typeof maybeErrors === "object") {
          setFieldErrors(maybeErrors);
          return;
        }
        setToast(data.message || "Cập nhật đợt thực tập thất bại.");
        return;
      }
      setToast(data.message || "Cập nhật đợt thực tập thành công.");
      closeEditModal();
      await load({ force: true });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật đợt thực tập thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/internship-batches/${deleteTarget.id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Xóa đợt thực tập thất bại.");
      setToast(data.message || "Xóa đợt thực tập thành công.");
      setDeleteTarget(null);
      await load({ force: true });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa đợt thực tập thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doCloseStatus = async () => {
    if (!statusTarget) return;
    setBusyId(statusTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/internship-batches/${statusTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      setToast(data.message || "Đã đóng đợt thực tập.");
      setStatusTarget(null);
      await load({ force: true });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const canClose = (t: InternshipBatchRow) => t.status === "OPEN";

  const exportStudentsExcel = async (row: InternshipBatchRow) => {
    setBusyId(row.id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/internship-batches/${encodeURIComponent(row.id)}/export-students`);
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(j?.message || "Không xuất được file Excel.");
      }
      const cd = res.headers.get("Content-Disposition");
      let fn = "danh_sach_sinh_vien.xlsx";
      if (cd) {
        const star = /filename\*=UTF-8''([^;\s]+)/i.exec(cd);
        if (star?.[1]) {
          try {
            fn = decodeURIComponent(star[1]);
          } catch {
            fn = star[1];
          }
        } else {
          const plain = /filename="([^"]+)"/i.exec(cd);
          if (plain?.[1]) fn = plain[1];
        }
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không xuất được file Excel.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý đợt thực tập</h1>
        <p className={styles.subtitle}>Thêm, sửa, xóa và cập nhật trạng thái mở/đóng của các đợt.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && batchStatusStats ? (
        <section aria-label="Thống kê trạng thái đợt thực tập">
          <div className={styles.statsGrid2}>
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Đợt thực tập đang mở"
              value={batchStatusStats.open}
              Icon={FiUnlock}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statLabel}
              valueClassName={styles.statValue}
              label="Đợt thực tập đã đóng"
              value={batchStatusStats.closed}
              Icon={FiLock}
            />
          </div>
        </section>
      ) : null}

      <AdminInternshipBatchToolbar
        searchName={searchName}
        searchStart={searchStart}
        searchEnd={searchEnd}
        searchStatus={searchStatus}
        onChangeSearchName={setSearchName}
        onChangeSearchStart={setSearchStart}
        onChangeSearchEnd={setSearchEnd}
        onChangeSearchStatus={setSearchStatus}
        onSearch={() => void load()}
        onCreate={startCreate}
      />

      <AdminInternshipBatchTableSection
        loading={loading}
        items={items}
        page={page}
        busyId={busyId}
        canClose={canClose}
        onPageChange={setPage}
        onView={setViewTarget}
        onEdit={(row) => {
          setEditTarget(row);
          syncFormFromTarget(row);
        }}
        onDelete={setDeleteTarget}
        onOpenStatus={setStatusTarget}
        onExportStudentsExcel={(r) => void exportStudentsExcel(r)}
      />

      <AdminInternshipBatchViewPopup viewTarget={viewTarget} onClose={() => setViewTarget(null)} />

      <AdminInternshipBatchEditModal
        editTarget={editTarget}
        form={form}
        fieldErrors={fieldErrors}
        busy={busyId !== null}
        onClose={closeEditModal}
        onSubmitCreate={() => void submitCreate()}
        onSubmitEdit={() => void submitEdit()}
        onOpenStatus={(t) => setStatusTarget(t)}
        setForm={setForm}
      />

      <AdminInternshipBatchDeletePopup
        deleteTarget={deleteTarget}
        busy={busyId !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void doDelete()}
      />

      <AdminInternshipBatchStatusPopup
        statusTarget={statusTarget}
        busy={busyId !== null}
        onClose={() => setStatusTarget(null)}
        onConfirmClose={() => void doCloseStatus()}
      />
    </main>
  );
}

