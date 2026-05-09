"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import Pagination from "../../components/Pagination";

import type {
  AssignmentItem,
  AssignmentStatus,
  OpenBatch,
  SupervisorOption,
  StudentOption
} from "@/lib/types/admin-phan-cong-gvhd";

import {
  ADMIN_PHAN_CONG_GVHD_PAGE_SIZE,
  ADMIN_PHAN_CONG_GVHD_STATUS_LABEL
} from "@/lib/constants/admin-phan-cong-gvhd";

import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

import AdminPhanCongGVHDTable from "./components/AdminPhanCongGVHDTable";
import AdminPhanCongGVHDToolbar from "./components/AdminPhanCongGVHDToolbar";
import AdminPhanCongGVHDDeletePopup from "./components/AdminPhanCongGVHDDeletePopup";
import AdminPhanCongGVHDViewPopup from "./components/AdminPhanCongGVHDViewPopup";
import AdminPhanCongGVHDFormPopup from "./components/AdminPhanCongGVHDFormPopup";

export default function AdminPhanCongGVHDPage() {
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [openBatches, setOpenBatches] = useState<OpenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "all">("all");

  const [toastPopup, setToastPopup] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showPopup = (message: string) => setToastPopup({ open: true, message });

  const [viewTarget, setViewTarget] = useState<AssignmentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AssignmentItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [formFaculty, setFormFaculty] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [formSupervisorId, setFormSupervisorId] = useState("");
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [supervisorQ, setSupervisorQ] = useState("");
  const [studentQ, setStudentQ] = useState("");
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const paged = useMemo(() => {
    const start = (page - 1) * ADMIN_PHAN_CONG_GVHD_PAGE_SIZE;
    return items.slice(start, start + ADMIN_PHAN_CONG_GVHD_PAGE_SIZE);
  }, [items, page]);

  async function loadList(nextPage = 1) {
    setLoading(true);
    setError("");
    try {
      const url = new URL("/api/admin/assignments", window.location.origin);
      if (searchQ.trim()) url.searchParams.set("q", searchQ.trim());
      if (filterFaculty !== "all") url.searchParams.set("faculty", filterFaculty);
      if (filterStatus !== "all") url.searchParams.set("status", filterStatus);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách phân công.");
      setItems(Array.isArray(data.items) ? data.items : []);
      setFaculties(Array.isArray(data.faculties) ? data.faculties : []);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách phân công.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBaseOptions() {
    try {
      const res = await fetch("/api/admin/assignments/options");
      const data = await res.json();
      if (!res.ok || !data?.success) return;
      setOpenBatches(Array.isArray(data.openBatches) ? data.openBatches : []);
      if (Array.isArray(data.faculties)) setFaculties(data.faculties);
    } catch {
      // ignore
    }
  }

  async function loadSupervisorOptions(args: { faculty: string; batchId: string; includeId?: string }) {
    const { faculty, batchId, includeId } = args;
    if (!faculty || !batchId) return;
    const url = new URL("/api/admin/assignments/options/supervisors", window.location.origin);
    url.searchParams.set("faculty", faculty);
    url.searchParams.set("internshipBatchId", batchId);
    if (supervisorQ.trim()) url.searchParams.set("q", supervisorQ.trim());
    if (includeId) url.searchParams.set("includeId", includeId);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.items)) setSupervisorOptions(data.items);
  }

  async function loadStudentOptions(args: { faculty: string; batchId: string; includeIds?: string[] }) {
    const { faculty, batchId, includeIds } = args;
    if (!faculty || !batchId) return;
    const url = new URL("/api/admin/assignments/options/students", window.location.origin);
    url.searchParams.set("faculty", faculty);
    url.searchParams.set("internshipBatchId", batchId);
    if (studentQ.trim()) url.searchParams.set("q", studentQ.trim());
    if (includeIds?.length) url.searchParams.set("includeIds", includeIds.join(","));
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.items)) setStudentOptions(data.items);
  }

  function openAdd() {
    setFieldErrors({});
    setSupervisorQ("");
    setStudentQ("");
    setSupervisorOptions([]);
    setStudentOptions([]);
    setFormFaculty("");
    setFormBatchId("");
    setFormSupervisorId("");
    setFormStudentIds([]);
    setAddOpen(true);
  }

  async function openEdit(item: AssignmentItem) {
    setFieldErrors({});
    setSupervisorQ("");
    setStudentQ("");
    setSupervisorOptions([]);
    setStudentOptions([]);
    setEditTarget(item);

    setFormFaculty(item.faculty);
    setFormBatchId(item.batch.id || "");
    setFormSupervisorId(item.supervisor.id || "");
    setFormStudentIds(item.students.map((s) => s.id || "").filter(Boolean));

    setOptionsLoading(true);
    try {
      await Promise.all([
        loadSupervisorOptions({ faculty: item.faculty, batchId: item.batch.id || "", includeId: item.supervisor.id || undefined }),
        loadStudentOptions({ faculty: item.faculty, batchId: item.batch.id || "", includeIds: item.students.map((s) => s.id || "").filter(Boolean) })
      ]);
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    loadBaseOptions();
    loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQ, filterFaculty, filterStatus]);

  useEffect(() => {
    if (!addOpen) return;
    if (!formFaculty || !formBatchId) return;
    setOptionsLoading(true);
    Promise.all([
      loadSupervisorOptions({ faculty: formFaculty, batchId: formBatchId }),
      loadStudentOptions({ faculty: formFaculty, batchId: formBatchId })
    ]).finally(() => setOptionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen, formFaculty, formBatchId]);

  useEffect(() => {
    if (!(addOpen || editTarget)) return;
    if (!formFaculty || !formBatchId) return;
    const includeId = editTarget?.supervisor?.id || undefined;
    const includeIds = editTarget?.students?.map((s) => s.id || "").filter(Boolean) || [];
    loadSupervisorOptions({ faculty: formFaculty, batchId: formBatchId, includeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorQ]);

  useEffect(() => {
    if (!(addOpen || editTarget)) return;
    if (!formFaculty || !formBatchId) return;
    const includeIds = editTarget?.students?.map((s) => s.id || "").filter(Boolean) || [];
    loadStudentOptions({ faculty: formFaculty, batchId: formBatchId, includeIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentQ]);

  function validateForm() {
    const next: Record<string, string> = {};
    if (!formFaculty) next.faculty = "Khoa bắt buộc.";
    if (!formBatchId) next.internshipBatchId = "Đợt thực tập bắt buộc.";
    if (!formSupervisorId) next.supervisorProfileId = "GVHD bắt buộc.";
    if (!formStudentIds.length) next.studentProfileIds = "Danh sách sinh viên hướng dẫn bắt buộc.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitCreateOrEdit() {
    if (!validateForm()) return;

    setBusyId("submit");
    setError("");
    try {
      const payload = {
        faculty: formFaculty,
        internshipBatchId: formBatchId,
        supervisorProfileId: formSupervisorId,
        studentProfileIds: formStudentIds
      };
      const isEdit = Boolean(editTarget?.id);
      const res = await fetch(isEdit ? `/api/admin/assignments/${editTarget!.id}` : "/api/admin/assignments", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { supervisorProfileId: payload.supervisorProfileId, studentProfileIds: payload.studentProfileIds } : payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors) setFieldErrors(data.errors);
        throw new Error(data?.message || "Không thể lưu phân công.");
      }
      showPopup(data?.message || (isEdit ? "Cập nhật phân công thành công." : "Tạo phân công thành công."));
      setAddOpen(false);
      setEditTarget(null);
      await loadList(1);
    } catch (e: any) {
      showPopup(e?.message || "Không thể lưu phân công.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/assignments/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể xóa phân công.");
      showPopup(data?.message || "Xóa phân công thành công.");
      setDeleteTarget(null);
      await loadList(1);
    } catch (e: any) {
      showPopup(e?.message || "Không thể xóa phân công.");
    } finally {
      setBusyId(null);
    }
  }

  const formTitle = editTarget ? "Sửa phân công" : "Thêm phân công";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phân công GVHD</h1>
    
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <AdminPhanCongGVHDToolbar
        searchQ={searchQ}
        filterFaculty={filterFaculty}
        filterStatus={filterStatus}
        faculties={faculties}
        loading={loading}
        onChangeSearchQ={setSearchQ}
        onChangeFilterFaculty={setFilterFaculty}
        onChangeFilterStatus={setFilterStatus}
        onSearch={() => void loadList(1)}
        onOpenAdd={openAdd}
      />

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <AdminPhanCongGVHDTable
          paged={paged}
          page={page}
          busyId={busyId}
          onView={(it) => setViewTarget(it)}
          onEdit={(it) => void openEdit(it)}
          onDelete={(it) => setDeleteTarget(it)}
        />
      )}

      <Pagination
        page={page}
        pageSize={ADMIN_PHAN_CONG_GVHD_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={setPage}
        buttonClassName={styles.btn}
      />

      {addOpen || editTarget ? (
        <AdminPhanCongGVHDFormPopup
          open
          title={formTitle}
          busyId={busyId}
          isEditing={Boolean(editTarget)}
          faculties={faculties}
          openBatches={openBatches}
          supervisorOptions={supervisorOptions}
          studentOptions={studentOptions}
          optionsLoading={optionsLoading}
          formFaculty={formFaculty}
          formBatchId={formBatchId}
          formSupervisorId={formSupervisorId}
          formStudentIds={formStudentIds}
          fieldErrors={fieldErrors}
          supervisorQ={supervisorQ}
          studentQ={studentQ}
          onClose={() => {
            setAddOpen(false);
            setEditTarget(null);
          }}
          onSubmit={() => void submitCreateOrEdit()}
          setFormFaculty={setFormFaculty}
          setFormBatchId={setFormBatchId}
          setFormSupervisorId={setFormSupervisorId}
          setFormStudentIds={setFormStudentIds}
          setSupervisorQ={setSupervisorQ}
          setStudentQ={setStudentQ}
        />
      ) : null}

      <AdminPhanCongGVHDViewPopup viewTarget={viewTarget} onClose={() => setViewTarget(null)} />

      <AdminPhanCongGVHDDeletePopup
        deleteTarget={deleteTarget}
        busyId={busyId}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void submitDelete()}
      />

      {toastPopup.open ? (
        <MessagePopup
          open
          title="Thông báo"
          onClose={() => setToastPopup({ open: false, message: "" })}
          actions={
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setToastPopup({ open: false, message: "" })}>
              Đóng
            </button>
          }
        >
          {toastPopup.message}
        </MessagePopup>
      ) : null}
    </main>
  );
}

