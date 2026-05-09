"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import type { ApiResponse, JobDetailResponse, JobFormState, JobListItem, JobStatus } from "@/lib/types/doanhnghiep-tuyen-dung";
import { DOANHNGHIEP_TUYEN_DUNG_PAGE_SIZE } from "@/lib/constants/doanhnghiep-tuyen-dung";
import { metaRecord } from "@/lib/utils/enterprise-meta";
import {
  buildEmptyJobFormState,
  buildJobCreatePayload,
  buildJobEditPayload,
  buildJobFormForAdd,
  buildJobFormForEdit,
  validateJobForm
} from "@/lib/utils/doanhnghiep-tuyen-dung";
import TuyenDungToolbar from "./components/TuyenDungToolbar";
import TuyenDungTableSection from "./components/TuyenDungTableSection";
const TuyenDungViewPopup = dynamic(() => import("./components/TuyenDungViewPopup"), { ssr: false });
const TuyenDungStopPopup = dynamic(() => import("./components/TuyenDungStopPopup"), { ssr: false });
const TuyenDungDeletePopup = dynamic(() => import("./components/TuyenDungDeletePopup"), { ssr: false });
const TuyenDungAddPopup = dynamic(() => import("./components/TuyenDungAddPopup"), { ssr: false });
const TuyenDungEditPopup = dynamic(() => import("./components/TuyenDungEditPopup"), { ssr: false });

export default function DoanhNghiepTuyenDungPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JobListItem[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [facultyOptions, setFacultyOptions] = useState<string[]>([]);

  const [searchQ, setSearchQ] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStatus, setSearchStatus] = useState<"all" | JobStatus>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [viewJob, setViewJob] = useState<JobDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [stopTarget, setStopTarget] = useState<JobListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobListItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobListItem | null>(null);
  const [editDetail, setEditDetail] = useState<JobDetailResponse | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [enterpriseDefaults, setEnterpriseDefaults] = useState<{ intro: string; website: string }>({ intro: "", website: "" });

  const [form, setForm] = useState<JobFormState>(() => buildEmptyJobFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFormChange = (updates: Partial<JobFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const loadEnterpriseDefaults = async () => {
    const res = await fetch("/api/doanhnghiep/me");
    const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
    if (!res.ok || !data.success || !data.item) return;
    const m = metaRecord(data.item.enterpriseMeta);
    const website = typeof m.website === "string" ? m.website : "";
    setEnterpriseDefaults({ intro: "", website });
  };

  const load = async (params?: { q?: string; date?: string }) => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const url = new URL("/api/doanhnghiep/tuyen-dung", window.location.origin);
      if (params?.q !== undefined) url.searchParams.set("q", params.q || "");
      if (params?.date) url.searchParams.set("date", params.date);
      // Status is NOT passed to server — we filter client-side to always have all counts for stats
      const res = await fetch(url.toString());
      const data = (await res.json()) as ApiResponse<JobListItem[]>;
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được tin tuyển dụng.");
      setItems((data.items || []) as JobListItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await load({ q: searchQ, date: searchDate });
  };

  useEffect(() => {
    void (async () => {
      await loadEnterpriseDefaults();
      try {
        const res = await fetch("/api/public/faculties");
        const data = await res.json();
        setFacultyOptions(Array.isArray(data?.faculties) ? data.faculties : []);
      } catch {
        setFacultyOptions([]);
      }
      await load({ q: searchQ, date: searchDate });
    })();
  }, []);

  const resetFormForAdd = () => {
    setFieldErrors({});
    setForm(buildJobFormForAdd({ enterpriseDefaults }));
  };

  const resetFormForEdit = (detail: JobDetailResponse) => {
    setFieldErrors({});
    setForm(buildJobFormForEdit({ detail, enterpriseDefaults }));
  };

  const validateForm = (): boolean => {
    const { isValid, errors } = validateJobForm(form);
    setFieldErrors(errors);
    return isValid;
  };

  const openView = async (row: JobListItem) => {
    setViewJob(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${row.id}`);
      const data = (await res.json()) as ApiResponse<JobDetailResponse>;
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được chi tiết tin tuyển dụng.");
      setViewJob(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = async (row: JobListItem) => {
    setEditTarget(row);
    setEditDetail(null);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${row.id}`);
      const data = (await res.json()) as ApiResponse<JobDetailResponse>;
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được chi tiết tin tuyển dụng.");
      setEditDetail(data.item);
      resetFormForEdit(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi tải chi tiết.");
      setEditTarget(null);
    } finally {
      setEditLoading(false);
    }
  };

  const submitCreate = async () => {
    setFieldErrors({});
    if (!validateForm()) return;
    setBusyId("add");
    setToast("");
    try {
      const res = await fetch("/api/doanhnghiep/tuyen-dung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildJobCreatePayload(form))
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) {
        const maybeErrors = (data as { errors?: Record<string, string> })?.errors;
        if (maybeErrors && typeof maybeErrors === "object") { setFieldErrors(maybeErrors); return; }
        setToast(data.message || "Tạo tin thất bại.");
        return;
      }
      setToast(data.message || "Tạo tin tuyển dụng thành công.");
      setAddOpen(false);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Tạo tin thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setFieldErrors({});
    if (!validateForm()) return;
    setBusyId(editTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildJobEditPayload(form))
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) {
        const maybeErrors = (data as { errors?: Record<string, string> })?.errors;
        if (maybeErrors && typeof maybeErrors === "object") { setFieldErrors(maybeErrors); return; }
        setToast(data.message || "Sửa tin thất bại.");
        return;
      }
      setToast(data.message || "Sửa tin tuyển dụng thành công.");
      setEditTarget(null);
      setEditDetail(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Sửa tin thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doStop = async () => {
    if (!stopTarget) return;
    setBusyId(stopTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${stopTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) throw new Error(data.message || "Dừng hoạt động thất bại.");
      setToast(data.message || "Đã dừng hoạt động.");
      setStopTarget(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Dừng hoạt động thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${deleteTarget.id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) { setToast(data.message || "Xóa thất bại."); return; }
      setToast(data.message || "Xóa tin tuyển dụng thành công.");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openAdd = async () => {
    setToast("");
    try {
      const res = await fetch("/api/doanhnghiep/tuyen-dung/open-batch");
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Lỗi kiểm tra đợt thực tập.");
      if (!data.hasOpenBatch) {
        setToast("Phòng đào tạo chưa mở đợt thực tập. Vui lòng chờ đến khi mở đợt thực tập");
        return;
      }
      resetFormForAdd();
      setAddOpen(true);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không thể mở form tạo tin.");
    }
  };

  // Stats computed from ALL items (before status filter)
  const statCards = [
    { label: "Chờ duyệt",      status: "PENDING"  as const },
    { label: "Từ chối duyệt",  status: "REJECTED" as const },
    { label: "Đang hoạt động", status: "ACTIVE"   as const },
    { label: "Dừng hoạt động", status: "STOPPED"  as const }
  ].map((c) => ({ ...c, count: items.filter((i) => i.status === c.status).length }));

  // Client-side status filter for table display
  const displayItems =
    searchStatus === "all" ? items : items.filter((i) => i.status === searchStatus);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tin tuyển dụng</h1>
        <p className={styles.subtitle}>Quản lý tin tuyển dụng thực tập sinh của doanh nghiệp.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
      {error ? <p className={styles.modulePlaceholder}>{error}</p> : null}

      {/* Stat cards */}
      {!loading && (
        <div className={styles.statsGrid}>
          {statCards.map((s) => (
            <div key={s.status} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      <TuyenDungToolbar
        searchQ={searchQ}
        searchDate={searchDate}
        searchStatus={searchStatus}
        onSearchQChange={setSearchQ}
        onSearchDateChange={setSearchDate}
        onSearchStatusChange={setSearchStatus}
        onSearch={() => void refresh()}
        onAdd={() => void openAdd()}
      />

      <TuyenDungTableSection
        loading={loading}
        items={displayItems}
        page={page}
        busyId={busyId}
        onView={(row) => void openView(row)}
        onEdit={(row) => void openEdit(row)}
        onStop={setStopTarget}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
      />

      <TuyenDungViewPopup
        viewJob={viewJob}
        viewLoading={viewLoading}
        onClose={() => setViewJob(null)}
      />

      <TuyenDungStopPopup
        stopTarget={stopTarget}
        busyId={busyId}
        onConfirm={() => void doStop()}
        onCancel={() => setStopTarget(null)}
      />

      <TuyenDungDeletePopup
        deleteTarget={deleteTarget}
        busyId={busyId}
        onConfirm={() => void doDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <TuyenDungAddPopup
        open={addOpen}
        form={form}
        facultyOptions={facultyOptions}
        fieldErrors={fieldErrors}
        busyId={busyId}
        onChange={handleFormChange}
        onCancel={() => setAddOpen(false)}
        onSubmit={() => void submitCreate()}
      />

      <TuyenDungEditPopup
        editTarget={editTarget}
        editDetail={editDetail}
        editLoading={editLoading}
        form={form}
        facultyOptions={facultyOptions}
        fieldErrors={fieldErrors}
        busyId={busyId}
        onChange={handleFormChange}
        onCancel={() => { setEditTarget(null); setEditDetail(null); }}
        onSubmit={() => void submitEdit()}
      />
    </main>
  );
}
