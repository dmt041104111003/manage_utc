"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";

type Degree = "BACHELOR" | "ENGINEER";
type Gender = "MALE" | "FEMALE" | "OTHER";
type InternshipStatus = "NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED";

type StudentListItem = {
  id: string; // StudentProfile.id
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: Degree;
  internshipStatus: InternshipStatus;
  phone: string | null;
  email: string;
  birthDate: string | null;
  gender: Gender;
  permanentProvinceCode: string;
  permanentWardCode: string;
  permanentProvinceName: string | null;
  permanentWardName: string | null;
  hasLinkedData: boolean;
};

type Province = { code: number; name: string };
type Ward = { code: number; name: string };

type ViewStudent = Omit<StudentListItem, "hasLinkedData">;

type StudentFormState = {
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  facultyCustom: string;
  cohort: string;
  degree: Degree | "";
  phone: string;
  email: string;
  birthDate: string; // yyyy-mm-dd
  gender: Gender | "";
  permanentProvinceCode: string;
  permanentWardCode: string;
};

const MSV_PATTERN = /^\d{8,15}$/;
const NAME_PATTERN = /^[\p{L}\s]{1,255}$/u;
const PHONE_PATTERN = /^\d{8,12}$/;
const CLASS_PATTERN = /^[\p{L}\d]{1,255}$/u;
const KHOL_PATTERN = /^[\p{L}\d]{1,10}$/u;

const degreeLabel: Record<Degree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

const genderLabel: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
};

const internshipStatusLabel: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Thực tập tự túc",
  REPORT_SUBMITTED: "Đã nộp báo cáo thực tập",
  COMPLETED: "Hoàn thành thực tập"
};

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function calcAgeFromBirthDate(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function toBirthDateInputValue(iso: string | null) {
  if (!iso) return "";
  // expect ISO date
  return new Date(iso).toISOString().slice(0, 10);
}

const EMPTY_FORM: StudentFormState = {
  msv: "",
  fullName: "",
  className: "",
  faculty: "",
  facultyCustom: "",
  cohort: "",
  degree: "",
  phone: "",
  email: "",
  birthDate: todayDateInputValue(),
  gender: "",
  permanentProvinceCode: "",
  permanentWardCode: ""
};

export default function AdminQuanLySinhVienPage() {
  const [items, setItems] = useState<StudentListItem[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [form, setForm] = useState<StudentFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [busyId, setBusyId] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPopup = (message: string) => setToastPopup({ open: true, message });

  const resetForm = () => {
    setFieldErrors({});
    setForm({ ...EMPTY_FORM, birthDate: todayDateInputValue() });
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

  const FACULTY_CUSTOM_VALUE = "__custom__";

  const computeValidationErrors = (draft: StudentFormState) => {
    const next: Record<string, string> = {};
    if (!draft.msv || !MSV_PATTERN.test(draft.msv.trim())) next.msv = "Mã sinh viên chỉ gồm số (8–15 ký tự).";
    if (!draft.fullName || !NAME_PATTERN.test(draft.fullName.trim())) next.fullName = "Họ tên chỉ gồm chữ và dấu cách (1–255 ký tự).";
    if (!draft.phone || !PHONE_PATTERN.test(draft.phone.trim())) next.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
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

    if (!draft.className || !CLASS_PATTERN.test(draft.className.trim())) next.className = "Lớp chỉ gồm chữ và số (1–255 ký tự).";
    const effectiveFaculty = draft.faculty === FACULTY_CUSTOM_VALUE ? draft.facultyCustom.trim() : draft.faculty.trim();
    if (!effectiveFaculty) next.faculty = "Khoa bắt buộc.";
    if (draft.faculty === FACULTY_CUSTOM_VALUE && draft.facultyCustom && !NAME_PATTERN.test(draft.facultyCustom.trim())) {
      next.facultyCustom = "Khoa chỉ gồm chữ và dấu cách (1–255 ký tự).";
    }
    if (!draft.cohort || !KHOL_PATTERN.test(draft.cohort.trim())) next.cohort = "Khóa chỉ gồm chữ và số (1–10 ký tự).";
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
          faculty: (form.faculty === FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
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
          faculty: (form.faculty === FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
          cohort: form.cohort.trim(),
          degree: form.degree,
          phone: form.phone.trim(),
          email: editTarget.email, // keep login email
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

  const [statusTarget, setStatusTarget] = useState<StudentListItem | null>(null);
  const [statusDraft, setStatusDraft] = useState<InternshipStatus>("NOT_STARTED");

  const openStatus = (row: StudentListItem) => {
    setStatusTarget(row);
    setStatusDraft(row.internshipStatus);
  };

  const submitStatus = async () => {
    if (!statusTarget) return;
    setBusyId(statusTarget.id);
    try {
      const res = await fetch(`/api/admin/students/${statusTarget.id}/internship-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internshipStatus: statusDraft })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      showPopup(data.message || "Cập nhật trạng thái thành công.");
      setStatusTarget(null);
      await load();
    } catch (e) {
      showPopup(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

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

  const semesterGenderOptions: { value: Gender; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" }
  ];

  const degreeOptions: { value: Degree; label: string }[] = [
    { value: "BACHELOR", label: "Cử nhân" },
    { value: "ENGINEER", label: "Kỹ sư" }
  ];

  const internshipStatusOptions: InternshipStatus[] = [
    "NOT_STARTED",
    "DOING",
    "SELF_FINANCED",
    "REPORT_SUBMITTED",
    "COMPLETED"
  ];

  const handleSearch = () => void load();

  // Excel import (bulk): parse in client and send rows to API.
  const [importBusy, setImportBusy] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const downloadExcelTemplate = async () => {
    const XLSXMod = await import("xlsx");
    const XLSX = XLSXMod as any;
    const header = [
      "MSV",
      "Họ tên",
      "Lớp",
      "Khoa",
      "Khóa",
      "Bậc",
      "SĐT",
      "Email",
      "Ngày sinh",
      "Giới tính",
      "Tỉnh",
      "Phường/Xã"
    ];
    const ws = XLSX.utils.aoa_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sinh viên");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_sinh_vien.xlsx";
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

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label>Tìm theo MSV / Họ tên / SĐT / Email</label>
          <input
            className={styles.textInputSearch}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Nhập từ khóa"
          />
        </div>

        <div className={styles.searchField}>
          <label>Khoa</label>
          <select className={styles.selectInput} value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}>
            <option value="all">Tất cả</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchField}>
          <label>Trạng thái thực tập</label>
          <select
            className={styles.selectInput}
            value={filterInternshipStatus}
            onChange={(e) => setFilterInternshipStatus(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            {internshipStatusOptions.map((s) => (
              <option key={s} value={s}>
                {internshipStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchField}>
          <label>Bậc</label>
          <select className={styles.selectInput} value={filterDegree} onChange={(e) => setFilterDegree(e.target.value as any)}>
            <option value="all">Tất cả</option>
            {degreeOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSearch}>
          Tìm kiếm
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 12 }}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAddSingle} disabled={busyId !== null}>
          Thêm sinh viên
        </button>
        <button type="button" className={styles.btn} onClick={openAddBulk} disabled={busyId !== null}>
          Thêm danh sách (Excel)
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <div className={`${styles.tableWrap} data-table-responsive-wrap`}>
          <table className={`${styles.dataTable} data-table-responsive`}>
            <thead>
              <tr>
                <th>STT</th>
                <th>MSV</th>
                <th>Họ tên</th>
                <th>Lớp</th>
                <th>Khoa</th>
                <th>Bậc</th>
                <th>Trạng thái thực tập</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.modulePlaceholder}>
                    Không có sinh viên phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{idx + 1}</td>
                    <td data-label="MSV">{row.msv}</td>
                    <td data-label="Họ tên">{row.fullName}</td>
                    <td data-label="Lớp">{row.className}</td>
                    <td data-label="Khoa">{row.faculty}</td>
                    <td data-label="Bậc">{degreeLabel[row.degree]}</td>
                    <td data-label="Trạng thái thực tập">{internshipStatusLabel[row.internshipStatus]}</td>
                    <td data-label="Thao tác">
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => void openView(row)}>
                        Xem
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => openEdit(row)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => setDeleteTarget(row)}
                      >
                        Xóa
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => openStatus(row)}>
                        Theo dõi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Popup xem */}
      {viewOpen && viewStudent ? (
        <MessagePopup
          open
          title="Xem thông tin sinh viên"
          size="extraWide"
          onClose={() => {
            setViewOpen(false);
            setViewStudent(null);
          }}
        >
          <table className={styles.viewModalDetailTable}>
            <tbody>
              <tr>
                <th scope="row">MSV</th>
                <td>{viewStudent.msv}</td>
              </tr>
              <tr>
                <th scope="row">Họ tên</th>
                <td>{viewStudent.fullName}</td>
              </tr>
              <tr>
                <th scope="row">Lớp</th>
                <td>{viewStudent.className}</td>
              </tr>
              <tr>
                <th scope="row">Khoa</th>
                <td>{viewStudent.faculty}</td>
              </tr>
              <tr>
                <th scope="row">Khóa</th>
                <td>{viewStudent.cohort}</td>
              </tr>
              <tr>
                <th scope="row">Bậc</th>
                <td>{degreeLabel[viewStudent.degree]}</td>
              </tr>
              <tr>
                <th scope="row">SĐT</th>
                <td>{viewStudent.phone ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{viewStudent.email}</td>
              </tr>
              <tr>
                <th scope="row">Ngày sinh</th>
                <td>{viewStudent.birthDate ? toBirthDateInputValue(viewStudent.birthDate) : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Giới tính</th>
                <td>{viewStudent.gender ? genderLabel[viewStudent.gender] : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Địa chỉ thường trú</th>
                <td>
                  {[viewStudent.permanentProvinceName, viewStudent.permanentWardName].filter(Boolean).join(" - ") || "—"}
                </td>
              </tr>
              <tr>
                <th scope="row">Trạng thái thực tập</th>
                <td>{internshipStatusLabel[viewStudent.internshipStatus]}</td>
              </tr>
            </tbody>
          </table>
        </MessagePopup>
      ) : null}

      {/* Popup xóa */}
      {deleteTarget ? (
        <MessagePopup
          open
          title="Xóa sinh viên"
          size="wide"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setDeleteTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busyId !== null} onClick={() => void submitDelete()}>
                Xóa
              </button>
            </>
          }
        >
          <p>
            Bạn có chắc chắn muốn xóa sinh viên - <strong>[{deleteTarget.msv}]</strong>-<strong>[{deleteTarget.fullName}]</strong> không?
          </p>
        </MessagePopup>
      ) : null}

      {/* Popup thêm từng SV */}
      {addOpen ? (
        <FormPopup
          open
          title="Thêm từng SV"
          busy={busyId !== null}
          onClose={() => {
            setAddOpen(false);
            resetForm();
          }}
          size="extraWide"
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setAddOpen(false)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void submitCreateSingle()} disabled={busyId !== null}>
                Tạo
              </button>
            </>
          }
        >
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Mã sinh viên <span className={formStyles.required}>*</span>
            </label>
            <input
              className={formStyles.input}
              value={form.msv}
              onChange={(e) => setForm((p) => ({ ...p, msv: e.target.value.replace(/[^\d]/g, "").slice(0, 15) }))}
              placeholder="Nhập mã sinh viên (8–15 số)"
            />
            {fieldErrors.msv ? <p className={formStyles.error}>{fieldErrors.msv}</p> : null}
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Họ tên <span className={formStyles.required}>*</span>
            </label>
            <input
              className={formStyles.input}
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nhập họ tên"
            />
            {fieldErrors.fullName ? <p className={formStyles.error}>{fieldErrors.fullName}</p> : null}
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                SĐT <span className={formStyles.required}>*</span>
              </label>
              <input
                className={formStyles.input}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 12) }))}
                placeholder="Nhập số điện thoại (8–12 số)"
              />
              {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Email <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="example@domain.com" />
              {fieldErrors.email ? <p className={formStyles.error}>{fieldErrors.email}</p> : null}
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Ngày sinh <span className={formStyles.required}>*</span>
              </label>
              <input type="date" className={formStyles.input} value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} />
              {fieldErrors.birthDate ? <p className={formStyles.error}>{fieldErrors.birthDate}</p> : null}
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Giới tính <span className={formStyles.required}>*</span>
              </label>
              <div style={{ display: "flex", gap: 14, paddingTop: 6 }}>
                {semesterGenderOptions.map((g) => (
                  <label key={g.value} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" checked={form.gender === g.value} onChange={() => setForm((p) => ({ ...p, gender: g.value }))} />
                    {g.label}
                  </label>
                ))}
              </div>
              {fieldErrors.gender ? <p className={formStyles.error}>{fieldErrors.gender}</p> : null}
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Địa chỉ thường trú (Tỉnh/Phường) <span className={formStyles.required}>*</span>
            </label>
            <div className={formStyles.grid2}>
              <div className={formStyles.field} style={{ marginBottom: 0 }}>
                <select
                  className={formStyles.select}
                  value={form.permanentProvinceCode}
                  onChange={(e) => setForm((p) => ({ ...p, permanentProvinceCode: e.target.value, permanentWardCode: "" }))}
                >
                  <option value="">{addrLoading.provinces ? "Đang tải…" : "Chọn tỉnh/thành"}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={String(p.code)}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.permanentProvinceCode ? <p className={formStyles.error}>{fieldErrors.permanentProvinceCode}</p> : null}
              </div>

              <div className={formStyles.field} style={{ marginBottom: 0 }}>
                <select
                  className={formStyles.select}
                  value={form.permanentWardCode}
                  onChange={(e) => setForm((p) => ({ ...p, permanentWardCode: e.target.value }))}
                  disabled={!form.permanentProvinceCode || addrLoading.wards}
                >
                  <option value="">{addrLoading.wards ? "Đang tải…" : !form.permanentProvinceCode ? "Chọn tỉnh trước" : "Chọn phường/xã"}</option>
                  {wards.map((w) => (
                    <option key={w.code} value={String(w.code)}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.permanentWardCode ? <p className={formStyles.error}>{fieldErrors.permanentWardCode}</p> : null}
              </div>
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Lớp <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.className} onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))} placeholder="Nhập lớp" />
              {fieldErrors.className ? <p className={formStyles.error}>{fieldErrors.className}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Khoa <span className={formStyles.required}>*</span>
              </label>
              <select
                className={formStyles.select}
                value={form.faculty}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, faculty: v, facultyCustom: v === FACULTY_CUSTOM_VALUE ? "" : p.facultyCustom }));
                }}
              >
                <option value="">Chọn khoa</option>
                {faculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value={FACULTY_CUSTOM_VALUE}>Tự nhập</option>
              </select>
              {fieldErrors.faculty ? <p className={formStyles.error}>{fieldErrors.faculty}</p> : null}
              {form.faculty === FACULTY_CUSTOM_VALUE ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    className={formStyles.input}
                    value={form.facultyCustom}
                    onChange={(e) => setForm((p) => ({ ...p, facultyCustom: e.target.value }))}
                    placeholder="Nhập khoa"
                  />
                  {fieldErrors.facultyCustom ? <p className={formStyles.error}>{fieldErrors.facultyCustom}</p> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Khóa <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.cohort} onChange={(e) => setForm((p) => ({ ...p, cohort: e.target.value }))} placeholder="Nhập khóa (1–10 ký tự chữ/số)" />
              {fieldErrors.cohort ? <p className={formStyles.error}>{fieldErrors.cohort}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Bậc <span className={formStyles.required}>*</span>
              </label>
              <select className={formStyles.select} value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value as any }))}>
                <option value="">Chọn bậc</option>
                {degreeOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {fieldErrors.degree ? <p className={formStyles.error}>{fieldErrors.degree}</p> : null}
            </div>
          </div>
        </FormPopup>
      ) : null}

      {/* Popup sửa */}
      {editTarget ? (
        <FormPopup
          open
          title="Sửa thông tin SV"
          busy={busyId !== null}
          onClose={() => {
            setEditTarget(null);
            resetForm();
          }}
          size="extraWide"
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setEditTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void submitEditSingle()} disabled={busyId !== null}>
                Lưu
              </button>
            </>
          }
        >
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Mã sinh viên <span className={formStyles.required}>*</span>
            </label>
            <input
              className={formStyles.input}
              value={form.msv}
              onChange={(e) => setForm((p) => ({ ...p, msv: e.target.value.replace(/[^\d]/g, "").slice(0, 15) }))}
              placeholder="MSV"
            />
            {fieldErrors.msv ? <p className={formStyles.error}>{fieldErrors.msv}</p> : null}
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Họ tên <span className={formStyles.required}>*</span>
            </label>
            <input className={formStyles.input} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Họ tên" />
            {fieldErrors.fullName ? <p className={formStyles.error}>{fieldErrors.fullName}</p> : null}
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                SĐT <span className={formStyles.required}>*</span>
              </label>
              <input
                className={formStyles.input}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 12) }))}
                placeholder="SĐT"
              />
              {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Email</label>
              <input className={formStyles.input} value={editTarget.email} disabled />
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Ngày sinh <span className={formStyles.required}>*</span>
              </label>
              <input type="date" className={formStyles.input} value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} />
              {fieldErrors.birthDate ? <p className={formStyles.error}>{fieldErrors.birthDate}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Giới tính <span className={formStyles.required}>*</span>
              </label>
              <div style={{ display: "flex", gap: 14, paddingTop: 6 }}>
                {semesterGenderOptions.map((g) => (
                  <label key={g.value} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" checked={form.gender === g.value} onChange={() => setForm((p) => ({ ...p, gender: g.value }))} />
                    {g.label}
                  </label>
                ))}
              </div>
              {fieldErrors.gender ? <p className={formStyles.error}>{fieldErrors.gender}</p> : null}
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Địa chỉ thường trú (Tỉnh/Phường) <span className={formStyles.required}>*</span>
            </label>
            <div className={formStyles.grid2}>
              <div className={formStyles.field} style={{ marginBottom: 0 }}>
                <select
                  className={formStyles.select}
                  value={form.permanentProvinceCode}
                  onChange={(e) => setForm((p) => ({ ...p, permanentProvinceCode: e.target.value, permanentWardCode: "" }))}
                >
                  <option value="">{addrLoading.provinces ? "Đang tải…" : "Chọn tỉnh/thành"}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={String(p.code)}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.permanentProvinceCode ? <p className={formStyles.error}>{fieldErrors.permanentProvinceCode}</p> : null}
              </div>
              <div className={formStyles.field} style={{ marginBottom: 0 }}>
                <select
                  className={formStyles.select}
                  value={form.permanentWardCode}
                  onChange={(e) => setForm((p) => ({ ...p, permanentWardCode: e.target.value }))}
                  disabled={!form.permanentProvinceCode || addrLoading.wards}
                >
                  <option value="">{addrLoading.wards ? "Đang tải…" : !form.permanentProvinceCode ? "Chọn tỉnh trước" : "Chọn phường/xã"}</option>
                  {wards.map((w) => (
                    <option key={w.code} value={String(w.code)}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.permanentWardCode ? <p className={formStyles.error}>{fieldErrors.permanentWardCode}</p> : null}
              </div>
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Lớp <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.className} onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))} placeholder="Lớp" />
              {fieldErrors.className ? <p className={formStyles.error}>{fieldErrors.className}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Khoa <span className={formStyles.required}>*</span>
              </label>
              <select
                className={formStyles.select}
                value={form.faculty}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, faculty: v, facultyCustom: v === FACULTY_CUSTOM_VALUE ? "" : p.facultyCustom }));
                }}
              >
                <option value="">Chọn khoa</option>
                {faculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value={FACULTY_CUSTOM_VALUE}>Tự nhập</option>
              </select>
              {fieldErrors.faculty ? <p className={formStyles.error}>{fieldErrors.faculty}</p> : null}
              {form.faculty === FACULTY_CUSTOM_VALUE ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    className={formStyles.input}
                    value={form.facultyCustom}
                    onChange={(e) => setForm((p) => ({ ...p, facultyCustom: e.target.value }))}
                    placeholder="Nhập khoa"
                  />
                  {fieldErrors.facultyCustom ? <p className={formStyles.error}>{fieldErrors.facultyCustom}</p> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Khóa <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.cohort} onChange={(e) => setForm((p) => ({ ...p, cohort: e.target.value }))} placeholder="Khóa" />
              {fieldErrors.cohort ? <p className={formStyles.error}>{fieldErrors.cohort}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Bậc <span className={formStyles.required}>*</span>
              </label>
              <select className={formStyles.select} value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value as any }))}>
                <option value="">Chọn bậc</option>
                {degreeOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {fieldErrors.degree ? <p className={formStyles.error}>{fieldErrors.degree}</p> : null}
            </div>
          </div>
        </FormPopup>
      ) : null}

      {/* Popup theo dõi trạng thái thực tập */}
      {statusTarget ? (
        <MessagePopup
          open
          title="Theo dõi trạng thái thực tập"
          size="wide"
          onClose={() => setStatusTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setStatusTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busyId !== null} onClick={() => void submitStatus()}>
                Lưu
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            SV: <strong>{statusTarget.msv}</strong> - {statusTarget.fullName}
          </p>
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Trạng thái</label>
            <select style={{ width: "100%", marginTop: 6 }} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as any)} disabled={busyId !== null}>
              {internshipStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {internshipStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>
        </MessagePopup>
      ) : null}

      {/* Popup thêm danh sách SV Excel */}
      {importOpen ? (
        <MessagePopup
          open
          title="Thêm danh sách SV"
          size="wide"
          onClose={() => {
            setImportOpen(false);
            setImportFile(null);
            setImportBusy(false);
          }}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setImportOpen(false)} disabled={importBusy}>
                Hủy
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={importBusy}
                onClick={() => {
                  if (!importFile) {
                    showPopup("Vui lòng chọn file excel để import.");
                    return;
                  }
                  void handleImportFile(importFile);
                }}
              >
                Tạo
              </button>
            </>
          }
        >
          <div style={{ marginTop: 8 }}>
            <p style={{ marginTop: 0 }}>Tải file excel mẫu:</p>
            <button type="button" className={styles.btn} onClick={() => void downloadExcelTemplate()} disabled={importBusy}>
              Tải mẫu Excel
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Upload file Excel</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              disabled={importBusy}
              style={{ width: "100%", marginTop: 6 }}
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <p className={styles.modulePlaceholder} style={{ marginTop: 8, fontSize: 12 }}>
              Sau khi chọn file, bấm `Tạo` để hệ thống import.
            </p>
            <p className={styles.modulePlaceholder} style={{ marginTop: 10 }}>
              Khi import thành công, hệ thống sẽ cấp tài khoản đăng nhập cho sinh viên (mật khẩu = ngày sinh).
            </p>
          </div>
        </MessagePopup>
      ) : null}

      {/* Popup "Thông báo" luôn render cuối để nổi trên mọi popup khác */}
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

