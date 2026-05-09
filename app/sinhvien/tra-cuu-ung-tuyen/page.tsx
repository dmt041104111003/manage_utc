"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import cardStyles from "./styles.module.css";

import type { SinhVienTraCuuUngTuyenItem, WorkTypeFilter } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";
import {
  SINHVIEN_TRA_CUU_UNG_TUYEN_EMPTY_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOADING_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SEARCH_BUTTON_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SUBTITLE,
  SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE,
  appliedStatusText,
  canApplyStatusText,
  getSinhVienTraCuuUngTuyenStatusNoteText,
  internshipLabel,
  workTypeLabel
} from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen";
import { fetchSinhVienTraCuuUngTuyenList, formatDateVi } from "@/lib/utils/sinhvien-tra-cuu-ung-tuyen";

export default function SinhVienTraCuuUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<SinhVienTraCuuUngTuyenItem[]>([]);
  const [canApply, setCanApply] = useState(false);
  const [internshipStatus, setInternshipStatus] = useState<"NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED" | "REJECTED">("NOT_STARTED");

  const [q, setQ] = useState("");
  const [workType, setWorkType] = useState<WorkTypeFilter>("all");
  const [field, setField] = useState("all");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSinhVienTraCuuUngTuyenList({ q, workType, field });
      setItems(result.items);
      setCanApply(result.canApply);
      setInternshipStatus(result.internshipStatus);
      setFieldOptions(result.fieldOptions);
    } catch (e: any) {
      setError(e?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusNote = useMemo(() => {
    return getSinhVienTraCuuUngTuyenStatusNoteText(canApply, internshipStatus);
  }, [canApply, internshipStatus]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE}</h1>
        <p className={styles.subtitle}>{SINHVIEN_TRA_CUU_UNG_TUYEN_SUBTITLE}</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField}>
          <label>Chuyên môn</label>
          <input className={adminStyles.textInputSearch} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập chuyên môn" />
        </div>
        <div className={adminStyles.searchField}>
          <label>Hình thức làm việc</label>
          <select className={adminStyles.selectInput} value={workType} onChange={(e) => setWorkType(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="PART_TIME">Part-time</option>
            <option value="FULL_TIME">Full-time</option>
          </select>
        </div>
        <div className={adminStyles.searchField}>
          <label>Lĩnh vực</label>
          <select className={adminStyles.selectInput} value={field} onChange={(e) => setField(e.target.value)}>
            <option value="all">Tất cả</option>
            {fieldOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void load()}>
          {SINHVIEN_TRA_CUU_UNG_TUYEN_SEARCH_BUTTON_TEXT}
        </button>
      </div>

      <p className={cardStyles.statusNote}>{statusNote}</p>

      {loading ? (
        <p className={styles.modulePlaceholder}>{SINHVIEN_TRA_CUU_UNG_TUYEN_LOADING_TEXT}</p>
      ) : items.length === 0 ? (
        <p className={styles.modulePlaceholder}>{SINHVIEN_TRA_CUU_UNG_TUYEN_EMPTY_TEXT}</p>
      ) : (
        <div className={cardStyles.cardGrid}>
          {items.map((item) => (
            <article key={item.id} className={cardStyles.jobCard}>
              <Link href={`/sinhvien/tra-cuu-ung-tuyen/${item.id}`} className={cardStyles.titleLink}>
                {item.title}
              </Link>
              <div className={cardStyles.company}>{item.companyName}</div>
              <div className={cardStyles.metaRow}>
                <span>{item.address}</span>
                <span>{workTypeLabel[item.workType]}</span>
              </div>
              <div className={cardStyles.metaRow}>
                <span>Chuyên môn: {item.expertise}</span>
                <span>Lương: {item.salary}</span>
              </div>
              <div className={cardStyles.metaRow}>
                <span>Kinh nghiệm: {item.experienceRequirement}</span>
                <span>Hạn tuyển: {formatDateVi(item.deadlineAt)}</span>
              </div>
              <div className={cardStyles.footer}>
                <span className={cardStyles.field}>{item.businessField}</span>
                <span className={item.hasApplied ? cardStyles.applied : cardStyles.open}>
                  {item.hasApplied ? appliedStatusText : canApplyStatusText}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

