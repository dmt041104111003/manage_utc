"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";
import Pagination from "../../components/Pagination";

type AssignmentStatus = "GUIDING" | "COMPLETED";
type StudentDegree = "BACHELOR" | "ENGINEER";
type SupervisorDegree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";

type OpenBatch = {
  id: string;
  name: string;
  semester: string;
  schoolYear: string;
};

type AssignmentItem = {
  id: string;
  faculty: string;
  status: AssignmentStatus;
  batch: { id: string | null; name: string | null; semester: string | null; schoolYear: string | null; status: string | null };
  supervisor: { id: string | null; fullName: string; degree: SupervisorDegree | null };
  students: { id: string | null; msv: string; fullName: string; degree: StudentDegree | null }[];
};

type SupervisorOption = { id: string; fullName: string; degree: SupervisorDegree; faculty: string };
type StudentOption = { id: string; msv: string; fullName: string; degree: StudentDegree };

const statusLabel: Record<AssignmentStatus, string> = { GUIDING: "Đang hướng dẫn", COMPLETED: "Hoàn thành hướng dẫn" };
const studentDegreeLabel: Record<StudentDegree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };
const supervisorDegreeLabel: Record<SupervisorDegree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

function studentDisplay(s: { msv: string; fullName: string; degree: StudentDegree | null }) {
  const d = s.degree ? studentDegreeLabel[s.degree] : "";
  return `${s.msv}-${s.fullName}${d ? `-${d}` : ""}`;
}

function supervisorDisplay(s: { fullName: string; degree: SupervisorDegree | null }) {
  const d = s.degree ? supervisorDegreeLabel[s.degree] : "";
  return `${d ? `${d}-` : ""}${s.fullName}`;
}

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
  const PAGE_SIZE = 10;

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
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
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
  const TABLE_STUDENTS_MAX_LINES = 2;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phân công GVHD</h1>
    
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.searchToolbar}>
        <div className={styles.searchField} style={{ minWidth: 320, flex: 1 }}>
          <label>Tìm kiếm</label>
          <input
            className={styles.textInputSearch}
            placeholder="Tên GVHD hoặc MSV/Họ tên SV"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        <div className={styles.searchField}>
          <label>Khoa</label>
          <select className={styles.selectInput} value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}>
            <option value="all">Tất cả khoa</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchField}>
          <label>Trạng thái</label>
          <select className={styles.selectInput} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="GUIDING">Đang hướng dẫn</option>
            <option value="COMPLETED">Hoàn thành hướng dẫn</option>
          </select>
        </div>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => loadList(1)} disabled={loading}>
          Tìm kiếm
        </button>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAdd}>
          Thêm phân công
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
                <th>MSV-Họ tên-Bậc</th>
                <th>Bậc-Họ tên GVHD</th>
                <th>Khoa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.modulePlaceholder}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                paged.map((it, idx) => (
                  <tr key={it.id}>
                    <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td data-label="MSV-Họ tên-Bậc">
                      {it.students.length ? (
                        <div style={{ display: "grid", gap: 4 }}>
                          {it.students.slice(0, TABLE_STUDENTS_MAX_LINES).map((s) => (
                            <div key={s.id ?? `${s.msv}-${s.fullName}`}>{studentDisplay(s as any)}</div>
                          ))}
                          {it.students.length > TABLE_STUDENTS_MAX_LINES ? (
                            <div style={{ color: "#6b7280" }}>+{it.students.length - TABLE_STUDENTS_MAX_LINES} SV</div>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-label="Bậc-Họ tên GVHD">{supervisorDisplay(it.supervisor as any)}</td>
                    <td data-label="Khoa">{it.faculty}</td>
                    <td data-label="Trạng thái">{statusLabel[it.status]}</td>
                    <td data-label="Thao tác">
                      <div className={styles.rowActions} style={{ gap: 10 }}>
                        <button type="button" className={styles.textLinkBtn} onClick={() => setViewTarget(it)} disabled={busyId !== null}>
                          Xem phân công
                        </button>
                        <button type="button" className={styles.textLinkBtn} onClick={() => openEdit(it)} disabled={busyId !== null}>
                          Sửa phân công
                        </button>
                        <button type="button" className={styles.textLinkBtn} onClick={() => setDeleteTarget(it)} disabled={busyId === it.id}>
                          Xóa phân công
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={items.length} onPageChange={setPage} buttonClassName={styles.btn} />

      {addOpen || editTarget ? (
        <FormPopup
          open
          title={formTitle}
          size="extraWide"
          onClose={() => {
            setAddOpen(false);
            setEditTarget(null);
          }}
          busy={busyId === "submit"}
          actions={
            <>
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setAddOpen(false);
                  setEditTarget(null);
                }}
                disabled={busyId === "submit"}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => void submitCreateOrEdit()}
                disabled={busyId === "submit"}
              >
                {editTarget ? "Sửa" : "Tạo"}
              </button>
            </>
          }
        >
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Khoa</label>
            <select
              className={formStyles.input}
              value={formFaculty}
              onChange={(e) => {
                if (editTarget) return;
                setFormFaculty(e.target.value);
                setFormSupervisorId("");
                setFormStudentIds([]);
              }}
              disabled={Boolean(editTarget)}
            >
              <option value="">Chọn khoa</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {fieldErrors.faculty ? <p className={styles.error}>{fieldErrors.faculty}</p> : null}
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Đợt thực tập</label>
            <select
              className={formStyles.input}
              value={formBatchId}
              onChange={(e) => {
                if (editTarget) return;
                setFormBatchId(e.target.value);
                setFormSupervisorId("");
                setFormStudentIds([]);
              }}
              disabled={Boolean(editTarget)}
            >
              <option value="">Chọn đợt thực tập (đang mở)</option>
              {openBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.semester} - {b.schoolYear})
                </option>
              ))}
            </select>
            {fieldErrors.internshipBatchId ? <p className={styles.error}>{fieldErrors.internshipBatchId}</p> : null}
          </div>

        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>GVHD</label>
          <input
            className={formStyles.input}
            placeholder="Tìm kiếm GVHD theo họ tên"
            value={supervisorQ}
            onChange={(e) => setSupervisorQ(e.target.value)}
            disabled={!formFaculty || !formBatchId}
          />
          <select
            className={formStyles.input}
            value={formSupervisorId}
            onChange={(e) => setFormSupervisorId(e.target.value)}
            disabled={!formFaculty || !formBatchId}
          >
            <option value="">{optionsLoading ? "Đang tải..." : "Chọn GVHD"}</option>
            {supervisorOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {supervisorDisplay({ fullName: s.fullName, degree: s.degree })}
              </option>
            ))}
          </select>
          {fieldErrors.supervisorProfileId ? <p className={styles.error}>{fieldErrors.supervisorProfileId}</p> : null}
        </div>

        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>SV hướng dẫn</label>
          <input
            className={formStyles.input}
            placeholder="Tìm kiếm SV theo MSV hoặc họ tên"
            value={studentQ}
            onChange={(e) => setStudentQ(e.target.value)}
            disabled={!formFaculty || !formBatchId}
          />

          <div style={{ border: "1px solid #d0d5dd", borderRadius: 8, padding: 10, maxHeight: 220, overflow: "auto" }}>
            {!formFaculty || !formBatchId ? (
              <div style={{ color: "#667085" }}>Vui lòng chọn khoa và đợt thực tập.</div>
            ) : optionsLoading ? (
              <div style={{ color: "#667085" }}>Đang tải danh sách sinh viên...</div>
            ) : studentOptions.length === 0 ? (
              <div style={{ color: "#667085" }}>Không có sinh viên phù hợp.</div>
            ) : (
              studentOptions.map((s) => {
                const checked = formStudentIds.includes(s.id);
                return (
                  <label key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setFormStudentIds((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                        );
                      }}
                    />
                    <span>{studentDisplay({ msv: s.msv, fullName: s.fullName, degree: s.degree })}</span>
                  </label>
                );
              })
            )}
          </div>
          {fieldErrors.studentProfileIds ? <p className={styles.error}>{fieldErrors.studentProfileIds}</p> : null}
        </div>
        </FormPopup>
      ) : null}

      {viewTarget ? (
        <MessagePopup
          open
          title="Xem phân công"
          size="extraWide"
          onClose={() => setViewTarget(null)}
          actions={
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setViewTarget(null)}>
              Đóng
            </button>
          }
        >
          <table className={styles.viewModalDetailTable}>
            <tbody>
              <tr>
                <th scope="row">Khoa</th>
                <td>{viewTarget.faculty}</td>
              </tr>
              <tr>
                <th scope="row">Đợt thực tập</th>
                <td>{viewTarget.batch?.name || "—"}</td>
              </tr>
              <tr>
                <th scope="row">GVHD</th>
                <td>{supervisorDisplay(viewTarget.supervisor as any) || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Trạng thái hướng dẫn</th>
                <td>{statusLabel[viewTarget.status]}</td>
              </tr>
              <tr>
                <th scope="row">SV hướng dẫn</th>
                <td>
                  {viewTarget.students.length ? (
                    <div style={{ display: "grid", gap: 4 }}>
                      {viewTarget.students.map((s) => (
                        <div key={s.id ?? `${s.msv}-${s.fullName}`}>{studentDisplay(s as any)}</div>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Ghi chú</th>
                <td style={{ color: "#667085" }}>
                  Trạng thái thực tập của sinh viên xem chi tiết trong module Quản lý sinh viên.
                </td>
              </tr>
            </tbody>
          </table>
        </MessagePopup>
      ) : null}

      {deleteTarget ? (
        <MessagePopup
          open
          title="Xóa phân công"
          size="wide"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setDeleteTarget(null)} disabled={busyId === deleteTarget?.id}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={submitDelete} disabled={busyId === deleteTarget?.id}>
                Xác nhận
              </button>
            </>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ margin: 0 }}>
              Bạn có chắc chắn muốn xóa Phân công: <b>[SV hướng dẫn]</b> - GVHD: <b>[GVHD]</b> không?
            </p>

            <table className={styles.viewModalDetailTable}>
              <tbody>
                <tr>
                  <th scope="row">SV hướng dẫn</th>
                  <td>
                    {deleteTarget.students.length ? (
                      <div style={{ display: "grid", gap: 4 }}>
                        {deleteTarget.students.slice(0, 3).map((s) => (
                          <div key={s.id ?? `${s.msv}-${s.fullName}`}>{studentDisplay(s as any)}</div>
                        ))}
                        {deleteTarget.students.length > 3 ? (
                          <div style={{ color: "#6b7280" }}>+{deleteTarget.students.length - 3} SV</div>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">GVHD</th>
                  <td>{supervisorDisplay(deleteTarget.supervisor as any) || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Khoa</th>
                  <td>{deleteTarget.faculty || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </MessagePopup>
      ) : null}

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

