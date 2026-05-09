"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import Pagination from "../../components/Pagination";
import FormPopup from "../../components/FormPopup";

type InternshipBatchStatus = "OPEN" | "CLOSED";
type Semester = "HK_I" | "HK_II" | "HK_HE" | "HK_PHU";

type InternshipBatchRow = {
  id: string;
  name: string;
  semester: Semester;
  schoolYear: string;
  startDate: string | null;
  endDate: string | null;
  status: InternshipBatchStatus;
  notes: string;
};

type ApiResponse<T> = { success: boolean; message?: string; item?: T; items?: T[]; errors?: Record<string, string> };

const statusLabel: Record<InternshipBatchStatus, string> = {
  OPEN: "Đang mở",
  CLOSED: "Đóng"
};

const semesterOptions: { value: Semester; label: string }[] = [
  { value: "HK_I", label: "HK I" },
  { value: "HK_II", label: "HK II" },
  { value: "HK_HE", label: "HK hè" },
  { value: "HK_PHU", label: "HK phụ" }
];

function formatDateVi(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(input: string) {
  // input: YYYY-MM-DD
  return new Date(`${input}T00:00:00.000Z`);
}

type BatchFormState = {
  name: string;
  semester: Semester | "";
  schoolYear: string;
  startDate: string;
  endDate: string;
  notes: string;
};

const EMPTY_FORM: BatchFormState = {
  name: "",
  semester: "",
  schoolYear: "",
  startDate: todayDateInputValue(),
  endDate: todayDateInputValue(),
  notes: ""
};

export default function AdminQuanLyDotThucTapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [items, setItems] = useState<InternshipBatchRow[]>([]);

  const [searchName, setSearchName] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");
  const [searchStatus, setSearchStatus] = useState<"all" | InternshipBatchStatus>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [viewTarget, setViewTarget] = useState<InternshipBatchRow | null>(null);

  const [editTarget, setEditTarget] = useState<InternshipBatchRow | null>(null);
  const [form, setForm] = useState<BatchFormState>(EMPTY_FORM);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (searchName.trim()) params.set("q", searchName.trim());
      if (searchStart) params.set("startDate", searchStart);
      if (searchEnd) params.set("endDate", searchEnd);
      if (searchStatus !== "all") params.set("status", searchStatus);

      const res = await fetch(`/api/admin/internship-batches?${params.toString()}`);
      const data = (await res.json()) as ApiResponse<InternshipBatchRow>;
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách đợt thực tập.");
      setItems((data.items || []) as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchName, searchStart, searchEnd, searchStatus]);

  useEffect(() => {
    void load();
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
    setForm({ ...EMPTY_FORM, startDate: todayDateInputValue(), endDate: todayDateInputValue() });
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
      await load();
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
      await load();
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
      await load();
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
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const canClose = (t: InternshipBatchRow) => t.status === "OPEN";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý đợt thực tập</h1>
        <p className={styles.subtitle}>Thêm, sửa, xóa và cập nhật trạng thái mở/đóng của các đợt.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label>Tên đợt thực tập</label>
          <input className={styles.textInputSearch} value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Nhập tên" />
        </div>
        <div className={styles.searchField}>
          <label>Thời gian bắt đầu</label>
          <input
            className={styles.textInputSearch}
            type="date"
            value={searchStart}
            onChange={(e) => setSearchStart(e.target.value)}
            placeholder="Chọn ngày"
          />
        </div>
        <div className={styles.searchField}>
          <label>Thời gian kết thúc</label>
          <input
            className={styles.textInputSearch}
            type="date"
            value={searchEnd}
            onChange={(e) => setSearchEnd(e.target.value)}
            placeholder="Chọn ngày"
          />
        </div>
        <div className={styles.searchField}>
          <label>Trạng thái</label>
          <select className={styles.selectInput} value={searchStatus} onChange={(e) => setSearchStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="OPEN">Đang mở</option>
            <option value="CLOSED">Đóng</option>
          </select>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void load()}>
          Tìm kiếm
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div />
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => startCreate()}>
          Thêm đợt thực tập
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <>
        {(() => {
          const pagedItems = items.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);
          return (
        <div className={`${styles.tableWrap} data-table-responsive-wrap`}>
          <table className={`${styles.dataTable} data-table-responsive`}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên đợt thực tập</th>
                <th>Học kỳ</th>
                <th>Năm học</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.modulePlaceholder}>
                    Không có đợt thực tập phù hợp.
                  </td>
                </tr>
              ) : (
                pagedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td data-label="Tên đợt thực tập">{row.name}</td>
                    <td data-label="Học kỳ">{semesterOptions.find((s) => s.value === row.semester)?.label ?? row.semester}</td>
                    <td data-label="Năm học">{row.schoolYear}</td>
                    <td data-label="Thời gian">
                      {formatDateVi(row.startDate)} - {formatDateVi(row.endDate)}
                    </td>
                    <td data-label="Trạng thái">{statusLabel[row.status]}</td>
                    <td data-label="Thao tác">
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => setViewTarget(row)}>
                        Xem
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => {
                          setEditTarget(row);
                          syncFormFromTarget(row);
                        }}
                      >
                        Sửa
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => setDeleteTarget(row)}>
                        Xóa
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null || !canClose(row)}
                        onClick={() => setStatusTarget(row)}
                      >
                        Cập nhật trạng thái
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          );
        })()}
        <Pagination page={page} pageSize={PAGE_SIZE} totalItems={items.length} onPageChange={setPage} buttonClassName={styles.btn} />
        </>
      )}

      {/* Popup xem */}
      {viewTarget ? (
        <MessagePopup
          open
          title="Xem thông tin đợt thực tập"
          size="wide"
          onClose={() => setViewTarget(null)}
        >
          <table className={styles.viewModalDetailTable}>
            <tbody>
              <tr>
                <th scope="row">Tên đợt thực tập</th>
                <td>{viewTarget.name}</td>
              </tr>
              <tr>
                <th scope="row">Học kỳ</th>
                <td>{semesterOptions.find((s) => s.value === viewTarget.semester)?.label ?? viewTarget.semester}</td>
              </tr>
              <tr>
                <th scope="row">Năm học</th>
                <td>{viewTarget.schoolYear}</td>
              </tr>
              <tr>
                <th scope="row">Thời gian bắt đầu</th>
                <td>{formatDateVi(viewTarget.startDate)}</td>
              </tr>
              <tr>
                <th scope="row">Thời gian kết thúc</th>
                <td>{formatDateVi(viewTarget.endDate)}</td>
              </tr>
              <tr>
                <th scope="row">Trạng thái</th>
                <td>{statusLabel[viewTarget.status]}</td>
              </tr>
              <tr>
                <th scope="row">Ghi chú</th>
                <td>{viewTarget.notes || "—"}</td>
              </tr>
            </tbody>
          </table>
        </MessagePopup>
      ) : null}

      {/* Popup thêm/sửa */}
      {editTarget ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="batch-edit-title">
          <div className={`${styles.modal} ${styles.modalWide}`}>
            <h2 id="batch-edit-title">{editTarget.id === "new" ? "Thêm đợt thực tập" : "Cập nhật đợt thực tập"}</h2>
            <div className={styles.searchToolbar} style={{ marginBottom: 10 }}>
              <div />
            </div>

            <div className={styles.card} style={{ padding: 0, border: "none", margin: 0 }}>
              <fieldset disabled={busyId !== null} style={{ border: 0, padding: 0, margin: 0 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Tên đợt thực tập <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Đợt thực tập 2026"
                  />
                  {fieldErrors.name ? <p className={formStyles.error}>{fieldErrors.name}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Học kỳ <span className={formStyles.required}>*</span>
                  </label>
                  <select className={formStyles.select} value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value as any }))}>
                    <option value="" disabled>
                      Chọn học kỳ
                    </option>
                    {semesterOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.semester ? <p className={formStyles.error}>{fieldErrors.semester}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Năm học <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.schoolYear}
                    onChange={(e) => setForm((p) => ({ ...p, schoolYear: e.target.value }))}
                    placeholder="VD: 2024-2025"
                  />
                  {fieldErrors.schoolYear ? <p className={formStyles.error}>{fieldErrors.schoolYear}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Thời gian bắt đầu <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    placeholder="Chọn ngày"
                  />
                  {fieldErrors.startDate ? <p className={formStyles.error}>{fieldErrors.startDate}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Thời gian kết thúc <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    placeholder="Chọn ngày"
                  />
                  {fieldErrors.endDate ? <p className={formStyles.error}>{fieldErrors.endDate}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Ghi chú <span className={formStyles.required}>*</span>
                  </label>
                  <textarea
                    className={formStyles.input as any}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Nhập ghi chú"
                  />
                  {fieldErrors.notes ? <p className={formStyles.error}>{fieldErrors.notes}</p> : null}
                </div>

                {editTarget.id !== "new" ? (
                  <div style={{ marginTop: 12 }}>
                    <p className={styles.statusNote}>
                      Trạng thái hiện tại: <strong>{statusLabel[editTarget.status]}</strong>
                    </p>
                    {editTarget.status === "OPEN" ? (
                      (() => {
                        const end = parseDateOnly(form.endDate);
                        const today = getTodayStart();
                        const canCloseInline = end.getTime() > today.getTime();
                        return canCloseInline ? (
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger}`}
                            disabled={busyId !== null}
                            onClick={() => {
                              setStatusTarget(editTarget);
                            }}
                          >
                            Đóng kỳ thực tập
                          </button>
                        ) : (
                          <p className={styles.statusNote}>Ngày kết thúc chưa quá hạn? Trạng thái sẽ tự động Đóng nếu quá hạn.</p>
                        );
                      })()
                    ) : null}
                  </div>
                ) : null}
              </fieldset>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => closeEditModal()}>
                Hủy
              </button>
              {editTarget.id === "new" ? (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busyId !== null} onClick={() => void submitCreate()}>
                  Tạo
                </button>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busyId !== null} onClick={() => void submitEdit()}>
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup xóa */}
      {deleteTarget ? (
        <MessagePopup
          open
          title="Xóa đợt thực tập"
          size="wide"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setDeleteTarget(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={busyId !== null}
                onClick={() => void doDelete()}
              >
                Xóa
              </button>
            </>
          }
        >
          <p>
            Bạn có chắc chắn muốn xóa Đợt thực tập <strong>{deleteTarget.name}</strong> không?
          </p>
        </MessagePopup>
      ) : null}

      {/* Popup cập nhật trạng thái (close) */}
      {statusTarget ? (
        <MessagePopup
          open
          title="Cập nhật trạng thái đợt thực tập"
          size="wide"
          onClose={() => setStatusTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setStatusTarget(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={busyId !== null}
                onClick={() => void doCloseStatus()}
              >
                Đóng
              </button>
            </>
          }
        >
          {(() => {
            const today = getTodayStart();
            const end = statusTarget.endDate ? new Date(statusTarget.endDate) : null;
            const tooLate = !end ? false : end.getTime() > today.getTime();
            const msg = tooLate
              ? "Chưa quá hạn thời gian đợt thực tập, xác nhận đóng kỳ thực tập?"
              : "Đợt thực tập sẽ chuyển trạng thái Đóng.";
            return <p>{msg}</p>;
          })()}
        </MessagePopup>
      ) : null}
    </main>
  );
}

