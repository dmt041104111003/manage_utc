"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { ADMIN_SUPERVISOR_EXCEL_HEADER, ADMIN_SUPERVISOR_EXCEL_SAMPLE_ROWS } from "@/lib/constants/admin-supervisors-excel";

import type {
  Degree,
  Province,
  SupervisorFormState,
  SupervisorListItem,
  Ward
} from "@/lib/types/admin-quan-ly-gvhd";
import {
  ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE,
  ADMIN_QUAN_LY_GVHD_NAME_PATTERN,
  ADMIN_QUAN_LY_GVHD_PHONE_PATTERN
} from "@/lib/constants/admin-quan-ly-gvhd";
import { calcAgeFromBirthDate, toBirthDateInputValue } from "@/lib/utils/admin-quan-ly-gvhd-dates";
import { buildEmptySupervisorFormState } from "@/lib/utils/admin-quan-ly-gvhd-form";

import AdminGiangVienToolbar from "./components/AdminGiangVienToolbar";
import AdminGiangVienTableSection from "./components/AdminGiangVienTableSection";
import AdminGiangVienViewPopup from "./components/AdminGiangVienViewPopup";
import AdminGiangVienDeletePopup from "./components/AdminGiangVienDeletePopup";
import AdminGiangVienFormPopup from "./components/AdminGiangVienFormPopup";
import AdminGiangVienImportPopup from "./components/AdminGiangVienImportPopup";

export default function AdminQuanLyGVHDPage() {
  const [items, setItems] = useState<SupervisorListItem[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterDegree, setFilterDegree] = useState<Degree | "all">("all");

  const [toastPopup, setToastPopup] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showPopup = (message: string) => setToastPopup({ open: true, message });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SupervisorListItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SupervisorListItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupervisorListItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [form, setForm] = useState<SupervisorFormState>(() => buildEmptySupervisorFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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
      if (filterDegree !== "all") params.set("degree", filterDegree);
      const res = await fetch(`/api/admin/supervisors?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách GVHD.");
      setItems(data.items || []);
      setFaculties(data.faculties || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setFieldErrors({});
    setForm(buildEmptySupervisorFormState());
  };

  const openAdd = () => {
    setEditTarget(null);
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (row: SupervisorListItem) => {
    setEditTarget(row);
    setFieldErrors({});
    setForm({
      fullName: row.fullName,
      phone: row.phone || "",
      email: row.email,
      birthDate: toBirthDateInputValue(row.birthDate),
      gender: row.gender,
      permanentProvinceCode: row.permanentProvinceCode,
      permanentWardCode: row.permanentWardCode,
      faculty: row.faculty,
      facultyCustom: "",
      degree: row.degree
    });
  };

  const computeValidationErrors = (draft: SupervisorFormState) => {
    const next: Record<string, string> = {};
    const effectiveFaculty =
      draft.faculty === ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE
        ? draft.facultyCustom.trim()
        : draft.faculty.trim();

    if (!draft.fullName || !ADMIN_QUAN_LY_GVHD_NAME_PATTERN.test(draft.fullName.trim()))
      next.fullName = "Họ tên chỉ gồm chữ và dấu cách (1–255 ký tự).";
    if (!draft.phone || !ADMIN_QUAN_LY_GVHD_PHONE_PATTERN.test(draft.phone.trim()))
      next.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
    if (!draft.email || !AUTH_EMAIL_REGISTER_PATTERN.test(draft.email.trim())) next.email = "Email không đúng định dạng (ví dụ: example@domain.com).";

    if (!draft.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate)) next.birthDate = "Ngày sinh không hợp lệ (YYYY-MM-DD).";
    else {
      const age = calcAgeFromBirthDate(draft.birthDate);
      if (age == null) next.birthDate = "Ngày sinh không hợp lệ.";
      else if (age < 18) next.birthDate = "GVHD phải đủ 18 tuổi trở lên.";
    }

    if (!draft.gender || !["MALE", "FEMALE", "OTHER"].includes(draft.gender)) next.gender = "Giới tính không hợp lệ.";
    if (!draft.permanentProvinceCode || !/^\d+$/.test(draft.permanentProvinceCode)) next.permanentProvinceCode = "Tỉnh/thành không hợp lệ.";
    if (!draft.permanentWardCode || !/^\d+$/.test(draft.permanentWardCode)) next.permanentWardCode = "Phường/xã không hợp lệ.";

    if (!effectiveFaculty) next.faculty = "Khoa bắt buộc.";
    if (
      draft.faculty === ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE &&
      draft.facultyCustom &&
      !ADMIN_QUAN_LY_GVHD_NAME_PATTERN.test(draft.facultyCustom.trim())
    ) {
      next.facultyCustom = "Khoa chỉ gồm chữ và dấu cách (1–255 ký tự).";
    }

    if (!draft.degree || !["MASTER", "PHD", "ASSOC_PROF", "PROF"].includes(draft.degree)) next.degree = "Bậc không hợp lệ.";
    return next;
  };

  const submitCreate = async () => {
    setBusyId("add");
    setFieldErrors({});
    try {
      const errors = computeValidationErrors(form);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      const res = await fetch("/api/admin/supervisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          birthDate: form.birthDate,
          gender: form.gender,
          permanentProvinceCode: form.permanentProvinceCode,
          permanentWardCode: form.permanentWardCode,
          faculty: (form.faculty === ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
          degree: form.degree
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        showPopup(data.message || "Tạo GVHD thất bại.");
        return;
      }
      showPopup(data.message || "Tạo GVHD thành công.");
      setAddOpen(false);
      resetForm();
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Tạo GVHD thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setBusyId(editTarget.id);
    setFieldErrors({});
    try {
      const errors = computeValidationErrors(form);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      const res = await fetch(`/api/admin/supervisors/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: editTarget.email,
          birthDate: form.birthDate,
          gender: form.gender,
          permanentProvinceCode: form.permanentProvinceCode,
          permanentWardCode: form.permanentWardCode,
          faculty: (form.faculty === ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
          degree: form.degree
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        showPopup(data.message || "Cập nhật GVHD thất bại.");
        return;
      }
      showPopup(data.message || "Cập nhật GVHD thành công.");
      setEditTarget(null);
      resetForm();
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Cập nhật GVHD thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openView = async (row: SupervisorListItem) => {
    try {
      const res = await fetch(`/api/admin/supervisors/${row.id}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được thông tin GVHD.");
      setViewItem(data.item as SupervisorListItem);
      setViewOpen(true);
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Không tải được thông tin GVHD.");
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/supervisors/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data.message || "Xóa thất bại.");
        return;
      }
      showPopup(data.message || "Xóa GVHD thành công.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const downloadExcelTemplate = async () => {
    const XLSXMod = await import("xlsx");
    const XLSX = XLSXMod as any;
    const ws = XLSX.utils.aoa_to_sheet([
      [...ADMIN_SUPERVISOR_EXCEL_HEADER],
      ...ADMIN_SUPERVISOR_EXCEL_SAMPLE_ROWS.map((r) => [
        r.fullName,
        r.phone,
        r.email,
        r.birthDate,
        r.gender,
        r.provinceName,
        r.wardName,
        r.faculty,
        r.degree
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

    ws["!cols"] = [
      { wch: 22 },
      { wch: 14 },
      { wch: 26 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 26 },
      { wch: 22 },
      { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GVHD");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_gvhd_co_du_lieu.xlsx";
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
      if (!rows2d || rows2d.length <= 1 || rows2d.slice(1).every((r) => r.every((c) => String(c || "").trim() === ""))) {
        showPopup("File Excel không có dữ liệu. Vui lòng kiểm tra lại.");
        return;
      }

      const header = (rows2d[0] || []).map((h) => String(h).trim());
      const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
      const i = {
        fullName: idx("Họ tên"),
        phone: idx("SĐT"),
        email: idx("Email"),
        birthDate: idx("Ngày sinh"),
        gender: idx("Giới tính"),
        province: idx("Tỉnh"),
        ward: idx("Phường/Xã"),
        faculty: idx("Khoa"),
        degree: idx("Bậc")
      };
      const hasAll = Object.values(i).every((x) => x >= 0);
      if (!hasAll) {
        showPopup("File Excel không đúng cột dữ liệu. Vui lòng kiểm tra lại.");
        return;
      }

      const payloadRows: any[] = [];
      for (let rIdx = 1; rIdx < rows2d.length; rIdx++) {
        const line = rIdx + 1;
        const row = rows2d[rIdx] || [];
        const get = (k: keyof typeof i) => String(row[i[k]] ?? "").trim();
        payloadRows.push({
          line,
          fullName: get("fullName"),
          phone: get("phone"),
          email: get("email"),
          birthDate: get("birthDate"),
          gender: get("gender"),
          permanentProvinceName: get("province"),
          permanentWardName: get("ward"),
          faculty: get("faculty"),
          degree: get("degree")
        });
      }

      const res = await fetch("/api/admin/supervisors/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data.message || "Tạo danh sách GVHD thất bại.");
        return;
      }
      showPopup(data.message || "Tạo danh sách GVHD thành công.");
      setImportOpen(false);
      setImportFile(null);
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Tạo danh sách GVHD thất bại.");
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý GVHD</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <AdminGiangVienToolbar
        searchQ={searchQ}
        filterFaculty={filterFaculty}
        filterDegree={filterDegree}
        faculties={faculties}
        busy={busyId !== null}
        onChangeSearchQ={setSearchQ}
        onChangeFilterFaculty={setFilterFaculty}
        onChangeFilterDegree={setFilterDegree}
        onSearch={() => void load()}
        onOpenAdd={openAdd}
        onOpenImport={() => setImportOpen(true)}
      />

      <AdminGiangVienTableSection
        loading={loading}
        items={items}
        page={page}
        busyId={busyId}
        onPageChange={setPage}
        onView={(row) => void openView(row)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <AdminGiangVienViewPopup
        open={viewOpen}
        item={viewItem}
        onClose={() => { setViewOpen(false); setViewItem(null); }}
      />

      <AdminGiangVienDeletePopup
        target={deleteTarget}
        busy={busyId !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void submitDelete()}
      />

      <AdminGiangVienFormPopup
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
        onSubmit={() => void submitCreate()}
        setForm={setForm}
      />

      <AdminGiangVienFormPopup
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
        onSubmit={() => void submitEdit()}
        setForm={setForm}
      />

      <AdminGiangVienImportPopup
        open={importOpen}
        importBusy={importBusy}
        importFile={importFile}
        onClose={() => { setImportOpen(false); setImportFile(null); setImportBusy(false); }}
        onSetImportFile={setImportFile}
        onDownloadTemplate={() => void downloadExcelTemplate()}
        onSubmitImport={() => {
          if (!importFile) { showPopup("Vui lòng chọn file Excel để import."); return; }
          void handleImportFile(importFile);
        }}
      />

      {toastPopup.open ? (
        <MessagePopup open title="Thông báo" message={toastPopup.message} onClose={() => setToastPopup({ open: false, message: "" })} />
      ) : null}
    </main>
  );
}

