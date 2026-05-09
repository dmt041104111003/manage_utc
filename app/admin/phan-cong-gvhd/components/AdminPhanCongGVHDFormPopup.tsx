"use client";

import type { Dispatch, SetStateAction } from "react";

import type { OpenBatch, SupervisorOption, StudentOption } from "@/lib/types/admin-phan-cong-gvhd";
import FormPopup from "../../../components/FormPopup";

import styles from "../../styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";
import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

export type Props = {
  open: boolean;
  busyId: string | null;

  faculties: string[];
  openBatches: OpenBatch[];
  supervisorOptions: SupervisorOption[];
  studentOptions: StudentOption[];
  optionsLoading: boolean;

  formFaculty: string;
  formBatchId: string;
  formSupervisorId: string;
  formStudentIds: string[];
  fieldErrors: Record<string, string>;

  supervisorQ: string;
  studentQ: string;

  onClose: () => void;
  onSubmit: () => void;

  setFormFaculty: Dispatch<SetStateAction<string>>;
  setFormBatchId: Dispatch<SetStateAction<string>>;
  setFormSupervisorId: Dispatch<SetStateAction<string>>;
  setFormStudentIds: Dispatch<SetStateAction<string[]>>;
  setSupervisorQ: Dispatch<SetStateAction<string>>;
  setStudentQ: Dispatch<SetStateAction<string>>;
};

export default function AdminPhanCongGVHDFormPopup(props: Props) {
  const {
    open,
    busyId,

    faculties,
    openBatches,
    supervisorOptions,
    studentOptions,
    optionsLoading,

    formFaculty,
    formBatchId,
    formSupervisorId,
    formStudentIds,
    fieldErrors,

    supervisorQ,
    studentQ,

    onClose,
    onSubmit,

    setFormFaculty,
    setFormBatchId,
    setFormSupervisorId,
    setFormStudentIds,
    setSupervisorQ,
    setStudentQ
  } = props;

  if (!open) return null;

  return (
    <FormPopup
      open
      title="Thêm phân công"
      size="extraWide"
      onClose={onClose}
      busy={busyId === "submit"}
      actions={
        <>
          <button type="button" className={styles.btn} onClick={onClose} disabled={busyId === "submit"}>
            Hủy
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => void onSubmit()}
            disabled={busyId === "submit"}
          >
            Tạo
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
            setFormFaculty(e.target.value);
            setFormSupervisorId("");
            setFormStudentIds([]);
          }}
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
            setFormBatchId(e.target.value);
            setFormSupervisorId("");
            setFormStudentIds([]);
          }}
        >
          <option value="">Chọn đợt thực tập (đang mở)</option>
          {openBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.semester} - {b.schoolYear})
            </option>
          ))}
        </select>
        {fieldErrors.internshipBatchId ? (
          <p className={styles.error}>{fieldErrors.internshipBatchId}</p>
        ) : null}
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
        {fieldErrors.supervisorProfileId ? (
          <p className={styles.error}>{fieldErrors.supervisorProfileId}</p>
        ) : null}
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
                      setFormStudentIds((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]));
                    }}
                  />
                  <span>
                    {studentDisplay({ msv: s.msv, fullName: s.fullName, degree: s.degree })}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {fieldErrors.studentProfileIds ? (
          <p className={styles.error}>{fieldErrors.studentProfileIds}</p>
        ) : null}
      </div>
    </FormPopup>
  );
}
