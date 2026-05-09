"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";
import Pagination from "../../components/Pagination";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { ADMIN_SUPERVISOR_EXCEL_HEADER, ADMIN_SUPERVISOR_EXCEL_SAMPLE_ROWS } from "@/lib/constants/admin-supervisors-excel";

type Gender = "MALE" | "FEMALE" | "OTHER";
type Degree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";

type SupervisorListItem = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  faculty: string;
  degree: Degree;
  birthDate: string | null;
  gender: Gender;
  permanentProvinceCode: string;
  permanentWardCode: string;
  permanentProvinceName: string | null;
  permanentWardName: string | null;
};

type Province = { code: number; name: string };
type Ward = { code: number; name: string };

type SupervisorFormState = {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: Gender | "";
  permanentProvinceCode: string;
  permanentWardCode: string;
  faculty: string;
  facultyCustom: string;
  degree: Degree | "";
};

const NAME_PATTERN = /^[\p{L}\s]{1,255}$/u;
const PHONE_PATTERN = /^\d{8,12}$/;
const FACULTY_CUSTOM_VALUE = "__custom__";

const genderLabel: Record<Gender, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
const degreeLabel: Record<Degree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

function todayDateInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  return new Date(iso).toISOString().slice(0, 10);
}

const EMPTY_FORM: SupervisorFormState = {
  fullName: "",
  phone: "",
  email: "",
  birthDate: todayDateInputValue(),
  gender: "",
  permanentProvinceCode: "",
  permanentWardCode: "",
  faculty: "",
  facultyCustom: "",
  degree: ""
};

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

  const [form, setForm] = useState<SupervisorFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const pagedItems = items.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setFieldErrors({});
    setForm({ ...EMPTY_FORM, birthDate: todayDateInputValue() });
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
    const effectiveFaculty = draft.faculty === FACULTY_CUSTOM_VALUE ? draft.facultyCustom.trim() : draft.faculty.trim();

    if (!draft.fullName || !NAME_PATTERN.test(draft.fullName.trim())) next.fullName = "Họ tên chỉ gồm chữ và dấu cách (1–255 ký tự).";
    if (!draft.phone || !PHONE_PATTERN.test(draft.phone.trim())) next.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
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
    if (draft.faculty === FACULTY_CUSTOM_VALUE && draft.facultyCustom && !NAME_PATTERN.test(draft.facultyCustom.trim())) {
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
          faculty: (form.faculty === FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
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
          faculty: (form.faculty === FACULTY_CUSTOM_VALUE ? form.facultyCustom : form.faculty).trim(),
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

  const degreeOptions: { value: Degree; label: string }[] = [
    { value: "MASTER", label: "Thạc sĩ" },
    { value: "PHD", label: "Tiến sĩ" },
    { value: "ASSOC_PROF", label: "Phó giáo sư" },
    { value: "PROF", label: "Giáo sư" }
  ];

  const genderOptions: { value: Gender; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" }
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý GVHD</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label>Tìm theo Họ tên / SĐT / Email</label>
          <input className={styles.textInputSearch} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Nhập từ khóa" />
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
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void load()}>
          Tìm kiếm
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 12 }}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAdd} disabled={busyId !== null}>
          Thêm GVHD
        </button>
        <button type="button" className={styles.btn} onClick={() => setImportOpen(true)} disabled={busyId !== null}>
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
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Khoa</th>
                <th>Bậc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.modulePlaceholder}>
                    Không có GVHD phù hợp.
                  </td>
                </tr>
              ) : (
                pagedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td data-label="Họ tên">{row.fullName}</td>
                    <td data-label="Số điện thoại">{row.phone ?? "—"}</td>
                    <td data-label="Email">{row.email}</td>
                    <td data-label="Khoa">{row.faculty}</td>
                    <td data-label="Bậc">{degreeLabel[row.degree]}</td>
                    <td data-label="Thao tác">
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => void openView(row)}>
                        Xem
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => openEdit(row)}>
                        Sửa
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => setDeleteTarget(row)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={items.length}
          onPageChange={setPage}
          buttonClassName={styles.btn}
          activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
        />
      ) : null}

      {viewOpen && viewItem ? (
        <MessagePopup open title="Xem thông tin GVHD" size="extraWide" onClose={() => (setViewOpen(false), setViewItem(null))}>
          <table className={styles.viewModalDetailTable}>
            <tbody>
              <tr>
                <th scope="row">Họ tên</th>
                <td>{viewItem.fullName}</td>
              </tr>
              <tr>
                <th scope="row">Số điện thoại</th>
                <td>{viewItem.phone ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{viewItem.email}</td>
              </tr>
              <tr>
                <th scope="row">Ngày sinh</th>
                <td>{viewItem.birthDate ? toBirthDateInputValue(viewItem.birthDate) : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Giới tính</th>
                <td>{genderLabel[viewItem.gender]}</td>
              </tr>
              <tr>
                <th scope="row">Địa chỉ thường trú</th>
                <td>{[viewItem.permanentProvinceName, viewItem.permanentWardName].filter(Boolean).join(" - ") || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Khoa</th>
                <td>{viewItem.faculty}</td>
              </tr>
              <tr>
                <th scope="row">Bậc</th>
                <td>{degreeLabel[viewItem.degree]}</td>
              </tr>
            </tbody>
          </table>
        </MessagePopup>
      ) : null}

      {deleteTarget ? (
        <MessagePopup
          open
          title="Xóa GVHD"
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
            Bạn có chắc chắn muốn xóa GVHD <strong>[{degreeLabel[deleteTarget.degree]}]</strong>-<strong>[{deleteTarget.fullName}]</strong>-<strong>[{deleteTarget.faculty}]</strong> không?
          </p>
        </MessagePopup>
      ) : null}

      {addOpen ? (
        <FormPopup
          open
          title="Thêm từng GV"
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
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void submitCreate()} disabled={busyId !== null}>
                Tạo
              </button>
            </>
          }
        >
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Họ tên <span className={formStyles.required}>*</span>
            </label>
            <input className={formStyles.input} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nhập họ tên" />
            {fieldErrors.fullName ? <p className={formStyles.error}>{fieldErrors.fullName}</p> : null}
          </div>

          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                SĐT <span className={formStyles.required}>*</span>
              </label>
              <input className={formStyles.input} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 12) }))} placeholder="Nhập số điện thoại" />
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
                {genderOptions.map((g) => (
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
                <select className={formStyles.select} value={form.permanentProvinceCode} onChange={(e) => setForm((p) => ({ ...p, permanentProvinceCode: e.target.value, permanentWardCode: "" }))}>
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
                <select className={formStyles.select} value={form.permanentWardCode} onChange={(e) => setForm((p) => ({ ...p, permanentWardCode: e.target.value }))} disabled={!form.permanentProvinceCode || addrLoading.wards}>
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
                  <input className={formStyles.input} value={form.facultyCustom} onChange={(e) => setForm((p) => ({ ...p, facultyCustom: e.target.value }))} placeholder="Nhập khoa" />
                  {fieldErrors.facultyCustom ? <p className={formStyles.error}>{fieldErrors.facultyCustom}</p> : null}
                </div>
              ) : null}
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

      {editTarget ? (
        <FormPopup
          open
          title="Sửa thông tin GV"
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
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void submitEdit()} disabled={busyId !== null}>
                Lưu
              </button>
            </>
          }
        >
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
              <input className={formStyles.input} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 12) }))} placeholder="SĐT" />
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
                {genderOptions.map((g) => (
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
                <select className={formStyles.select} value={form.permanentProvinceCode} onChange={(e) => setForm((p) => ({ ...p, permanentProvinceCode: e.target.value, permanentWardCode: "" }))}>
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
                <select className={formStyles.select} value={form.permanentWardCode} onChange={(e) => setForm((p) => ({ ...p, permanentWardCode: e.target.value }))} disabled={!form.permanentProvinceCode || addrLoading.wards}>
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
                  <input className={formStyles.input} value={form.facultyCustom} onChange={(e) => setForm((p) => ({ ...p, facultyCustom: e.target.value }))} placeholder="Nhập khoa" />
                  {fieldErrors.facultyCustom ? <p className={formStyles.error}>{fieldErrors.facultyCustom}</p> : null}
                </div>
              ) : null}
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

      {importOpen ? (
        <MessagePopup
          open
          title="Thêm danh sách GV"
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
                    showPopup("Vui lòng chọn file Excel để import.");
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
            <p style={{ marginTop: 0 }}>Tải file Excel mẫu:</p>
            <button type="button" className={styles.btn} onClick={() => void downloadExcelTemplate()} disabled={importBusy}>
              Tải mẫu Excel
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Upload file Excel</label>
            <input type="file" accept=".xlsx,.xls" disabled={importBusy} style={{ width: "100%", marginTop: 6 }} onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            <p className={styles.modulePlaceholder} style={{ marginTop: 10 }}>
              Khi import thành công, hệ thống sẽ cấp tài khoản đăng nhập cho GVHD (mật khẩu = ngày sinh).
            </p>
          </div>
        </MessagePopup>
      ) : null}

      {toastPopup.open ? (
        <MessagePopup open title="Thông báo" message={toastPopup.message} onClose={() => setToastPopup({ open: false, message: "" })} />
      ) : null}
    </main>
  );
}

