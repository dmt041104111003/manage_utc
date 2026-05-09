"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import cardStyles from "./styles.module.css";
import type { SinhVienTraCuuUngTuyenItem, WorkTypeFilter } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";
import {
  SINHVIEN_TRA_CUU_UNG_TUYEN_EMPTY_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOADING_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SUBTITLE,
  SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE,
  getSinhVienTraCuuUngTuyenStatusNoteText
} from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen";
import { fetchSinhVienTraCuuUngTuyenList } from "@/lib/utils/sinhvien-tra-cuu-ung-tuyen";
import TraCuuUngTuyenToolbar from "./components/TraCuuUngTuyenToolbar";
import TraCuuUngTuyenJobGrid from "./components/TraCuuUngTuyenJobGrid";

export default function SinhVienTraCuuUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<SinhVienTraCuuUngTuyenItem[]>([]);
  const [canApply, setCanApply] = useState(false);
  const [internshipStatus, setInternshipStatus] = useState<"NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED" | "REJECTED">("NOT_STARTED");

  const [q, setQ] = useState("");
  const [workType, setWorkType] = useState<WorkTypeFilter>("all");
  const [province, setProvince] = useState("all");
  const [provinceOptions, setProvinceOptions] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSinhVienTraCuuUngTuyenList({ q, workType, province });
      setItems(result.items);
      setCanApply(result.canApply);
      setInternshipStatus(result.internshipStatus);
      setProvinceOptions(result.provinceOptions);
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

      <TraCuuUngTuyenToolbar
        q={q}
        workType={workType}
        province={province}
        provinceOptions={provinceOptions}
        onQChange={setQ}
        onWorkTypeChange={setWorkType}
        onProvinceChange={setProvince}
        onSearch={() => void load()}
      />

      <p className={cardStyles.statusNote}>{statusNote}</p>

      {loading ? (
        <p className={styles.modulePlaceholder}>{SINHVIEN_TRA_CUU_UNG_TUYEN_LOADING_TEXT}</p>
      ) : items.length === 0 ? (
        <p className={styles.modulePlaceholder}>{SINHVIEN_TRA_CUU_UNG_TUYEN_EMPTY_TEXT}</p>
      ) : (
        <TraCuuUngTuyenJobGrid items={items} canApply={canApply} />
      )}
    </main>
  );
}

