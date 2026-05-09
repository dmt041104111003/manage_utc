"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import { DashboardStatSummaryCard } from "@/app/components/DashboardStatSummaryCard";
import { FiActivity, FiCheckCircle } from "react-icons/fi";
import type { BatchOption, GuidanceStatus, Row } from "@/lib/types/giangvien-sinh-vien";
import {
  GIANGVIEN_SINH_VIEN_ENDPOINT
} from "@/lib/constants/giangvien-sinh-vien";
import { buildGiangVienSinhVienQueryParams, getGiangVienSinhVienLoadErrorMessage } from "@/lib/utils/giangvien-sinh-vien";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
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

  async function load(opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const sp = buildGiangVienSinhVienQueryParams({ q, batchId, guidanceStatus });
      const url = `${GIANGVIEN_SINH_VIEN_ENDPOINT}?${sp.toString()}`;
      const cacheKey = `gv:sinh-vien:list:${url}`;
      if (!silent && (force || !hasCachedValue(cacheKey))) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || "Không thể tải danh sách sinh viên được phân công.");
          return payload;
        },
        { force }
      );
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
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, batchId, guidanceStatus]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sinh viên được phân công</h1>
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
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statCardTitle}
              valueClassName={styles.statValue}
              label="Đang thực tập"
              value={latestBatchGuidanceStats.guiding}
              Icon={FiActivity}
            />
            <DashboardStatSummaryCard
              cardClassName={styles.statCard}
              labelClassName={styles.statCardTitle}
              valueClassName={styles.statValue}
              label="Hoàn thành hướng dẫn thực tập"
              value={latestBatchGuidanceStats.completed}
              Icon={FiCheckCircle}
            />
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
        onSearch={() => void load({ force: true })}
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
