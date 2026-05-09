"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import cardStyles from "./styles.module.css";

type WorkType = "PART_TIME" | "FULL_TIME";
type InternshipStatus = "NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED";
type Item = {
  id: string;
  title: string;
  companyName: string;
  address: string;
  businessField: string;
  expertise: string;
  salary: string;
  experienceRequirement: string;
  workType: WorkType;
  deadlineAt: string | null;
  hasApplied: boolean;
};

const workTypeLabel: Record<WorkType, string> = { PART_TIME: "Part-time", FULL_TIME: "Full-time" };
const internshipLabel: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Tự túc",
  REPORT_SUBMITTED: "Đã nộp báo cáo",
  COMPLETED: "Hoàn thành"
};

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function SinhVienTraCuuUngTuyenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [canApply, setCanApply] = useState(false);
  const [internshipStatus, setInternshipStatus] = useState<InternshipStatus>("NOT_STARTED");

  const [q, setQ] = useState("");
  const [workType, setWorkType] = useState<"all" | WorkType>("all");
  const [field, setField] = useState("all");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (workType !== "all") sp.set("workType", workType);
      if (field !== "all") sp.set("field", field);
      const res = await fetch(`/api/sinhvien/tra-cuu-ung-tuyen?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách tin tuyển dụng.");
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
      setCanApply(Boolean(data.canApply));
      setInternshipStatus((data.internshipStatus || "NOT_STARTED") as InternshipStatus);
      const setFields = new Set<string>();
      nextItems.forEach((x: Item) =>
        String(x.businessField || "—")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .forEach((v) => setFields.add(v))
      );
      setFieldOptions(Array.from(setFields.values()));
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách tin tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusNote = useMemo(() => {
    if (canApply) return "Bạn có thể ứng tuyển.";
    return `Nút ứng tuyển bị khóa vì trạng thái thực tập hiện tại là "${internshipLabel[internshipStatus]}".`;
  }, [canApply, internshipStatus]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tra cứu và ứng tuyển</h1>
        <p className={styles.subtitle}>Danh sách tin tuyển dụng đã duyệt và còn hạn cho sinh viên.</p>
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
          Tìm kiếm
        </button>
      </div>

      <p className={cardStyles.statusNote}>{statusNote}</p>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : items.length === 0 ? (
        <p className={styles.modulePlaceholder}>Không có tin tuyển dụng phù hợp.</p>
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
                <span className={item.hasApplied ? cardStyles.applied : cardStyles.open}>{item.hasApplied ? "Đã ứng tuyển" : "Có thể ứng tuyển"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

