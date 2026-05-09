"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import type { BatchOption, GuidanceStatus, Row } from "@/lib/types/giangvien-sinh-vien";
import {
  GIANGVIEN_SINH_VIEN_ENDPOINT
} from "@/lib/constants/giangvien-sinh-vien";
import { buildGiangVienSinhVienQueryParams, getGiangVienSinhVienLoadErrorMessage } from "@/lib/utils/giangvien-sinh-vien";
import SinhVienToolbar from "./components/SinhVienToolbar";
import SinhVienTableSection from "./components/SinhVienTableSection";
import SinhVienViewPopup from "./components/SinhVienViewPopup";

type LatestBatchGuidanceStats = {
  batchId: string | null;
  batchName: string | null;
  guiding: number;
  completed: number;
};

const EMPTY_LATEST_STATS: LatestBatchGuidanceStats = {
  batchId: null,
  batchName: null,
  guiding: 0,
  completed: 0
};

export default function GiangvienSinhVienPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [batchId, setBatchId] = useState("");
  const [guidanceStatus, setGuidanceStatus] = useState<"all" | GuidanceStatus>("all");

  const [items, setItems] = useState<Row[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [latestBatchGuidanceStats, setLatestBatchGuidanceStats] =
    useState<LatestBatchGuidanceStats>(EMPTY_LATEST_STATS);

  const [viewTarget, setViewTarget] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = buildGiangVienSinhVienQueryParams({ q, batchId, guidanceStatus });
      const res = await fetch(`${GIANGVIEN_SINH_VIEN_ENDPOINT}?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách sinh viên được phân công.");
      setItems(Array.isArray(data.items) ? data.items : []);
      setBatches(Array.isArray(data.batches) ? data.batches : []);
      if (data.latestBatchGuidanceStats) {
        setLatestBatchGuidanceStats(data.latestBatchGuidanceStats as LatestBatchGuidanceStats);
      } else {
        setLatestBatchGuidanceStats(EMPTY_LATEST_STATS);
      }
    } catch (e: unknown) {
      setError(getGiangVienSinhVienLoadErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý sinh viên được phân công</h1>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {!loading && latestBatchGuidanceStats.batchId ? (
        <section className={styles.statsSection} aria-label="Thống kê đợt thực tập mới nhất">
          <p className={styles.statsSectionTitle}>
            Đợt thực tập mới nhất:{" "}
            <span className={styles.statsSectionBatchName}>
              {latestBatchGuidanceStats.batchName ?? "—"}
            </span>
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statCardTitle}>Đang thực tập</p>
              <p className={styles.statValue}>{latestBatchGuidanceStats.guiding}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statCardTitle}>Hoàn thành hướng dẫn thực tập</p>
              <p className={styles.statValue}>{latestBatchGuidanceStats.completed}</p>
            </div>
          </div>
        </section>
      ) : null}

      <SinhVienToolbar
        q={q}
        batchId={batchId}
        guidanceStatus={guidanceStatus}
        batches={batches}
        onQChange={setQ}
        onBatchIdChange={setBatchId}
        onGuidanceStatusChange={setGuidanceStatus}
        onSearch={() => void load()}
      />

      <SinhVienTableSection
        loading={loading}
        items={items}
        onView={setViewTarget}
      />

      <SinhVienViewPopup
        viewTarget={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </main>
  );
}
