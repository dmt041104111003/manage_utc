"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { ADMIN_STUDENT_EXCEL_HEADER, ADMIN_STUDENT_EXCEL_SAMPLE_ROWS } from "@/lib/constants/admin-students-excel";

import type {
  Degree,
  InternshipStatus,
  Province,
  StudentFormState,
  StudentListItem,
  ViewStudent,
  Ward
} from "@/lib/types/admin-quan-ly-sinh-vien";
import {
  ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE,
  ADMIN_QUAN_LY_SINH_VIEN_CLASS_PATTERN,
  ADMIN_QUAN_LY_SINH_VIEN_KHOL_PATTERN,
  ADMIN_QUAN_LY_SINH_VIEN_MSV_PATTERN,
  ADMIN_QUAN_LY_SINH_VIEN_NAME_PATTERN,
  ADMIN_QUAN_LY_SINH_VIEN_PHONE_PATTERN
} from "@/lib/constants/admin-quan-ly-sinh-vien";
import { calcAgeFromBirthDate, toBirthDateInputValue } from "@/lib/utils/admin-quan-ly-sinh-vien-dates";
import { buildEmptyStudentFormState } from "@/lib/utils/admin-quan-ly-sinh-vien-form";

import AdminSinhVienToolbar from "./components/AdminSinhVienToolbar";
import AdminSinhVienTableSection from "./components/AdminSinhVienTableSection";
import AdminSinhVienViewPopup from "./components/AdminSinhVienViewPopup";
import AdminSinhVienDeletePopup from "./components/AdminSinhVienDeletePopup";
import AdminSinhVienFormPopup from "./components/AdminSinhVienFormPopup";
import AdminSinhVienImportPopup from "./components/AdminSinhVienImportPopup";

export default function AdminQuanLySinhVienPage() {
  const [items, setItems] = useState<StudentListItem[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestBatchInternshipStats, setLatestBatchInternshipStats] = useState<{
    batchId: string | null;
    batchName: string | null;
    notStarted: number;
    doing: number;
    selfFinanced: number;
    reportSubmitted: number;
    completed: number;
    rejected: number;
  } | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterInternshipStatus, setFilterInternshipStatus] = useState<InternshipStatus | "all">("all");
  const [filterDegree, setFilterDegree] = useState<Degree | "all">("all");

  const [toastPopup, setToastPopup] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<ViewStudent | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<StudentListItem | null>(null);

  const [form, setForm] = useState<StudentFormState>(() => buildEmptyStudentFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // address dropdowns
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [addrLoading, setAddrLoading] = useState({ provinces: true, wards: false });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setAddrLoading({ provinces: true, wards: false });
        const res = await fetch("/api/vn-address/provinces");
        const data = await res.json();
        if (!cancelled) setProvinces((data.provinces || []) as Province[]);
      } catch {
        if (!cancelled) setProvinces([]);
      } finally {
        if (!cancelled) setAddrLoading((s) => ({ ...s, provinces: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!form.permanentProvinceCode) {
        setWards([]);
        return;
      }
      setAddrLoading((s) => ({ ...s, wards: true }));
      try {
        const res = await fetch(`/api/vn-address/provinces/${form.permanentProvinceCode}/wards`);
        const data = await res.json();
        if (!cancelled) setWards((data.wards || []) as Ward[]);
      } catch {
        if (!cancelled) setWards([]);
      } finally {
        if (!cancelled) setAddrLoading((s) => ({ ...s, wards: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.permanentProvinceCode]);

  const load = async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (filterFaculty !== "all") params.set("faculty", filterFaculty);
      if (filterInternshipStatus !== "all") params.set("status", filterInternshipStatus);
      if (filterDegree !== "all") params.set("degree", filterDegree);
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách sinh viên.");
      setItems(data.items || []);
      setFaculties(data.faculties || []);
      setLatestBatchInternshipStats(data.latestBatchInternshipStats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setFaculties([]);
      setLatestBatchInternshipStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPopup = (message: string) => setToastPopup({ open: true, message });

  const resetForm = () => {
    setFieldErrors({});
    setForm(buildEmptyStudentFormState());
  };

  const openAddSingle = () => {
    setEditTarget(null);
    resetForm();
    setAddOpen(true);
  };

  const openAddBulk = () => {
    setImportOpen(true);
  };

  const openEdit = (row: StudentListItem) => {
    setEditTarget(row);
    setAddOpen(false);
    setImportOpen(false);
    setFieldErrors({});
    setForm({
      msv: row.msv,
      fullName: row.fullName,
      className: row.className,
      faculty: row.faculty,
      facultyCustom: "",
      cohort: row.cohort,
      degree: row.degree,
      phone: row.phone || "",
      email: row.email,
      birthDate: toBirthDateInputValue(row.birthDate),
      gender: row.gender,
      permanentProvinceCode: row.permanentProvinceCode,
      permanentWardCode: row.permanentWardCode
    });
  };

  const computeValidationErrors = (draft: StudentFormState) => {
    const next: Record<string, string> = {};
    if (!draft.msv || !ADMIN_QUAN_LY_SINH_VIEN_MSV_PATTERN.test(draft.msv.trim())) next.msv = "Mã sinh viên chỉ gồm số (8–15 ký tự).";
    if (!draft.fullName || !ADMIN_QUAN_LY_SINH_VIEN_NAME_PATTERN.test(draft.fullName.trim())) next.fullName = "Họ tên chỉ gồm chữ và dấu cách (1–255 ký tự).";
    if (!draft.phone || !ADMIN_QUAN_LY_SINH_VIEN_PHONE_PATTERN.test(draft.phone.trim())) next.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
    if (!draft.email || !AUTH_EMAIL_REGISTER_PATTERN.test(draft.email.trim())) next.email = "Email không đúng định dạng example@domain.com.";

    if (!draft.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate)) next.birthDate = "Ngày sinh không hợp lệ (YYYY-MM-DD).";
    else {
      const age = calcAgeFromBirthDate(draft.birthDate);
      if (age == null) next.birthDate = "Ngày sinh không hợp lệ.";
      else if (age < 18) next.birthDate = "Sinh viên phải đủ 18 tuổi trở lên.";
    }

    if (!draft.gender || !["MALE", "FEMALE", "OTHER"].includes(draft.gender)) next.gender = "Giới tính không hợp lệ.";
    if (!draft.permanentProvinceCode || !/^\d+$/.test(draft.permanentProvinceCode)) next.permanentProvinceCode = "Tỉnh/thành không hợp lệ.";
    if (!draft.permanentWardCode || !/^\d+$/.test(draft.permanentWardCode)) next.permanentWardCode = "Phường/xã không hợp lệ.";

    if (!draft.className || !ADMIN_QUAN_LY_SINH_VIEN_CLASS_PATTERN.test(draft.className.trim())) next.className = "Lớp chỉ gồm chữ và số (1–255 ký tự).";
    const effectiveFaculty =
      draft.faculty === ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE ? draft.facultyCustom.trim() : draft.faculty.trim();
    if (!effectiveFaculty) next.faculty = "Khoa bắt buộc.";
    if (
      draft.faculty === ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE &&
      draft.facultyCustom &&
      !ADMIN_QUAN_LY_SINH_VIEN_NAME_PATTERN.test(draft.facultyCustom.trim())
    ) {
      next.facultyCustom = "Khoa chỉ gồm chữ và dấu cách (1–255 ký tự).";
    }
    if (!draft.cohort || !ADMIN_QUAN_LY_SINH_VIEN_KHOL_PATTERN.test(draft.cohort.trim())) next.cohort = "Khóa chỉ gồm chữ và số (1–10 ký tự).";
    if (!draft.degree || !["BACHELOR", "ENGINEER"].includes(draft.degree)) next.degree = "Bậc không hợp lệ.";
    return next;
  };

  const submitCreateSingle = async () => {
    setBusyId("add");
    setFieldErrors({});
    try {
      const errors = computeValidationErrors(form);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msv: form.msv.trim(),
          fullName: form.fullName.trim(),
          className: form.className.trim(),
          faculty:
            (form.faculty === ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
          cohort: form.cohort.trim(),
          degree: form.degree,
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          birthDate: form.birthDate,
          gender: form.gender,
          permanentProvinceCode: form.permanentProvinceCode,
          permanentWardCode: form.permanentWardCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        showPopup(data.message || "Tạo sinh viên thất bại.");
        return;
      }
      showPopup(data.message || "Tạo sinh viên thành công.");
      setAddOpen(false);
      resetForm();
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Tạo sinh viên thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitEditSingle = async () => {
    if (!editTarget) return;
    setBusyId(editTarget.id);
    setFieldErrors({});
    try {
      const errors = computeValidationErrors(form);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      const res = await fetch(`/api/admin/students/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msv: form.msv.trim(),
          fullName: form.fullName.trim(),
          className: form.className.trim(),
          faculty:
            (form.faculty === ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
          cohort: form.cohort.trim(),
          degree: form.degree,
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          birthDate: form.birthDate,
          gender: form.gender,
          permanentProvinceCode: form.permanentProvinceCode,
          permanentWardCode: form.permanentWardCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        showPopup(data.message || "Cập nhật sinh viên thất bại.");
        return;
      }
      showPopup(data.message || "Cập nhật sinh viên thành công.");
      setEditTarget(null);
      resetForm();
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Cập nhật sinh viên thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openView = async (row: StudentListItem) => {
    try {
      setViewStudent(null);
      const res = await fetch(`/api/admin/students/${row.id}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được thông tin sinh viên.");
      setViewStudent(data.item as ViewStudent);
      setViewOpen(true);
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Không tải được thông tin sinh viên.");
    }
  };

  // Removed "Theo dõi" internship status popup per requirement.

  // (openStatus, submitStatus, statusTarget, statusDraft removed)

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/students/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data.message || "Xóa thất bại.");
        return;
      }
      showPopup(data.message || "Xóa sinh viên thành công.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  // Excel import (bulk): parse in client and send rows to API.
  const [importBusy, setImportBusy] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const downloadExcelTemplate = async () => {
    const XLSXMod = await import("xlsx");
    const XLSX = XLSXMod as any;
    const ws = XLSX.utils.aoa_to_sheet([
      [...ADMIN_STUDENT_EXCEL_HEADER],
      ...ADMIN_STUDENT_EXCEL_SAMPLE_ROWS.map((r) => [
        r.msv,
        r.fullName,
        r.className,
        r.faculty,
        r.cohort,
        r.degree,
        r.phone,
        r.email,
        r.birthDate,
        r.gender,
        r.provinceName,
        r.wardName
      ])
    ]);

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = range.s.c; c <= range.e.c; c++) {
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) continue;
        cell.t = "s";
        cell.v = String(cell.v ?? "");
      }
    }

    // Width để không bị ####### ở ngày sinh / nội dung dài
    ws["!cols"] = [
      { wch: 12 }, // MSV
      { wch: 22 }, // Họ tên
      { wch: 10 }, // Lớp
      { wch: 22 }, // Khoa
      { wch: 10 }, // Khóa
      { wch: 10 }, // Bậc
      { wch: 14 }, // SĐT
      { wch: 26 }, // Email
      { wch: 12 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 14 }, // Tỉnh
      { wch: 26 } // Phường/Xã
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sinh viên");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_sinh_vien_co_du_lieu.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    setImportBusy(true);
    try {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
        showPopup("Chỉ hỗ trợ file Excel (.xlsx, .xls).");
        return;
      }

      const XLSXMod = await import("xlsx");
      const XLSX = XLSXMod as any;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows2d: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      // rows2d[0] is header
      if (!rows2d || rows2d.length <= 1 || rows2d.slice(1).every((r) => r.every((c) => String(c || "").trim() === ""))) {
        showPopup("File Excel k có dữ liệu. Vui lòng kt lại");
        return;
      }

      const header = (rows2d[0] || []).map((h) => String(h).trim());
      const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
      const i = {
        msv: idx("MSV"),
        fullName: idx("Họ tên"),
        className: idx("Lớp"),
        faculty: idx("Khoa"),
        cohort: idx("Khóa"),
        degree: idx("Bậc"),
        phone: idx("SĐT"),
        email: idx("Email"),
        birthDate: idx("Ngày sinh"),
        gender: idx("Giới tính"),
        province: idx("Tỉnh"),
        ward: idx("Phường/Xã")
      };

      const hasAll = Object.values(i).every((x) => x >= 0);
      if (!hasAll) {
        showPopup("File Excel không đúng cột dữ liệu. Vui lòng kiểm tra lại.");
        return;
      }

      const payloadRows: any[] = [];
      for (let rIdx = 1; rIdx < rows2d.length; rIdx++) {
        const line = rIdx + 1; // excel row number
        const row = rows2d[rIdx] || [];
        const get = (k: keyof typeof i) => String(row[i[k]] ?? "").trim();
        payloadRows.push({
          line,
          msv: get("msv"),
          fullName: get("fullName"),
          className: get("className"),
          faculty: get("faculty"),
          cohort: get("cohort"),
          degree: get("degree"),
          phone: get("phone"),
          email: get("email"),
          birthDate: get("birthDate"),
          gender: get("gender"),
          permanentProvinceName: get("province"),
          permanentWardName: get("ward")
        });
      }

      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data.message || "Tạo danh sách sinh viên thất bại.");
        return;
      }
      showPopup(data.message || "Tạo danh sách sinh viên thành công.");
      setImportOpen(false);
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Tạo danh sách sinh viên thất bại.");
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý sinh viên</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && latestBatchInternshipStats?.batchId ? (
        <section aria-label="Thống kê trạng thái thực tập đợt mới nhất">
          <div className={styles.statusNote} style={{ marginBottom: 10 }}>
            Đợt thực tập mới nhất: <strong>{latestBatchInternshipStats.batchName ?? "—"}</strong>
          </div>
          <div className={styles.statsGrid3}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Chưa thực tập</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.notStarted}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Đang thực tập</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.doing}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Thực tập tự túc</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.selfFinanced}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Đã nộp BCTT</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.reportSubmitted}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Hoàn thành</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.completed}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Từ chối</p>
              <p className={styles.statValue}>{latestBatchInternshipStats.rejected}</p>
            </div>
          </div>
        </section>
      ) : null}

      <AdminSinhVienToolbar
        searchQ={searchQ}
        filterFaculty={filterFaculty}
        filterInternshipStatus={filterInternshipStatus}
        filterDegree={filterDegree}
        faculties={faculties}
        busy={busyId !== null}
        onChangeSearchQ={setSearchQ}
        onChangeFilterFaculty={setFilterFaculty}
        onChangeFilterInternshipStatus={setFilterInternshipStatus}
        onChangeFilterDegree={setFilterDegree}
        onSearch={() => void load()}
        onOpenAdd={openAddSingle}
        onOpenImport={openAddBulk}
      />

      <AdminSinhVienTableSection
        loading={loading}
        items={items}
        page={page}
        busyId={busyId}
        onPageChange={setPage}
        onView={(row) => void openView(row)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <AdminSinhVienViewPopup
        open={viewOpen}
        student={viewStudent}
        onClose={() => { setViewOpen(false); setViewStudent(null); }}
      />

      <AdminSinhVienDeletePopup
        target={deleteTarget}
        busy={busyId !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void submitDelete()}
      />

      <AdminSinhVienFormPopup
        open={addOpen}
        mode="create"
        busy={busyId !== null}
        form={form}
        fieldErrors={fieldErrors}
        faculties={faculties}
        provinces={provinces}
        wards={wards}
        addrLoading={addrLoading}
        onClose={() => { setAddOpen(false); resetForm(); }}
        onSubmit={() => void submitCreateSingle()}
        setForm={setForm}
      />

      <AdminSinhVienFormPopup
        open={editTarget !== null}
        mode="edit"
        busy={busyId !== null}
        form={form}
        fieldErrors={fieldErrors}
        faculties={faculties}
        provinces={provinces}
        wards={wards}
        addrLoading={addrLoading}
        editEmail={editTarget?.email}
        onClose={() => { setEditTarget(null); resetForm(); }}
        onSubmit={() => void submitEditSingle()}
        setForm={setForm}
      />

      <AdminSinhVienImportPopup
        open={importOpen}
        importBusy={importBusy}
        importFile={importFile}
        onClose={() => { setImportOpen(false); setImportFile(null); setImportBusy(false); }}
        onSetImportFile={setImportFile}
        onDownloadTemplate={() => void downloadExcelTemplate()}
        onSubmitImport={() => {
          if (!importFile) { showPopup("Vui lòng chọn file excel để import."); return; }
          void handleImportFile(importFile);
        }}
      />

      {toastPopup.open ? (
        <MessagePopup
          open
          title="Thông báo"
          message={toastPopup.message}
          onClose={() => setToastPopup({ open: false, message: "" })}
        />
      ) : null}
    </main>
  );
}

