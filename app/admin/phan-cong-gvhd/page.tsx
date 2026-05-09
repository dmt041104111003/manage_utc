"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";
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
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminPhanCongGVHDTable from "./components/AdminPhanCongGVHDTable";
import AdminPhanCongGVHDToolbar from "./components/AdminPhanCongGVHDToolbar";
const AdminPhanCongGVHDDeletePopup = dynamic(() => import("./components/AdminPhanCongGVHDDeletePopup"), { ssr: false });
const AdminPhanCongGVHDViewPopup = dynamic(() => import("./components/AdminPhanCongGVHDViewPopup"), { ssr: false });
const AdminPhanCongGVHDFormPopup = dynamic(() => import("./components/AdminPhanCongGVHDFormPopup"), { ssr: false });

export default function AdminPhanCongGVHDPage() {
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [openBatches, setOpenBatches] = useState<OpenBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "all">("all");

  const [toastPopup, setToastPopup] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showPopup = (message: string) => setToastPopup({ open: true, message });

  const [viewTarget, setViewTarget] = useState<AssignmentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
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

  async function loadList(nextPage = 1, opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const url = new URL("/api/admin/assignments", window.location.origin);
      if (searchQ.trim()) url.searchParams.set("q", searchQ.trim());
      if (filterFaculty !== "all") url.searchParams.set("faculty", filterFaculty);
      if (filterStatus !== "all") url.searchParams.set("status", filterStatus);
      const reqUrl = url.toString();
      const cacheKey = `admin:assignments:list:${reqUrl}`;
      if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(reqUrl);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || "Không thể tải danh sách phân công.");
          return payload;
        },
        { force }
      );
      const rawItems: AssignmentItem[] = Array.isArray(data.items) ? data.items : [];
      const groupedMap = new Map<string, AssignmentItem>();
      for (const it of rawItems) {
        const key = String(it.supervisorAssignmentId || it.id);
        const current = groupedMap.get(key);
        const stu = it.student;
        if (!current) {
          groupedMap.set(key, {
            ...it,
            students: stu?.msv ? [stu] : []
          });
          continue;
        }
        if (stu?.id && !current.students?.some((s) => s.id === stu.id)) {
          current.students = [...(current.students || []), stu];
        }
      }
      setItems(Array.from(groupedMap.values()));
      setFaculties(Array.isArray(data.faculties) ? data.faculties : []);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách phân công.");
    } finally {
      if (!silent) setLoading(false);
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

  async function loadSupervisorOptions(args: { faculty: string; batchId: string }) {
    const { faculty, batchId } = args;
    if (!faculty || !batchId) return;
    const url = new URL("/api/admin/assignments/options/supervisors", window.location.origin);
    url.searchParams.set("faculty", faculty);
    url.searchParams.set("internshipBatchId", batchId);
    if (supervisorQ.trim()) url.searchParams.set("q", supervisorQ.trim());
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.items)) setSupervisorOptions(data.items);
  }

  async function loadStudentOptions(args: { faculty: string; batchId: string }) {
    const { faculty, batchId } = args;
    if (!faculty || !batchId) return;
    const url = new URL("/api/admin/assignments/options/students", window.location.origin);
    url.searchParams.set("faculty", faculty);
    url.searchParams.set("internshipBatchId", batchId);
    if (studentQ.trim()) url.searchParams.set("q", studentQ.trim());
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

  function closeAdd() {
    setAddOpen(false);
    setFieldErrors({});
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
    if (!addOpen || !formFaculty || !formBatchId) return;
    loadSupervisorOptions({ faculty: formFaculty, batchId: formBatchId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorQ]);

  useEffect(() => {
    if (!addOpen || !formFaculty || !formBatchId) return;
    loadStudentOptions({ faculty: formFaculty, batchId: formBatchId });
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

  async function submitCreate() {
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
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors) setFieldErrors(data.errors);
        throw new Error(data?.message || "Không thể tạo phân công.");
      }
      showPopup(data?.message || "Tạo phân công thành công.");
      closeAdd();
      await loadList(1, { force: true });
    } catch (e: any) {
      showPopup(e?.message || "Không thể tạo phân công.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/assignments/student-links/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể xóa phân công.");
      showPopup(data?.message || "Xóa phân công thành công.");
      setDeleteTarget(null);
      await loadList(1, { force: true });
    } catch (e: any) {
      showPopup(e?.message || "Không thể xóa phân công.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phân công giảng viên hướng dẫn</h1>
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

      {loading && items.length === 0 ? (
        <ChartStyleLoading variant="block" />
      ) : (
        <AdminPhanCongGVHDTable
          paged={paged}
          page={page}
          busyId={busyId}
          onView={(it) => setViewTarget(it)}
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

      {addOpen ? (
        <AdminPhanCongGVHDFormPopup
          open
          busyId={busyId}
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
          onClose={closeAdd}
          onSubmit={() => void submitCreate()}
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
