"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { Detail, ListRow } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";

import AdminTienDoToolbar from "./components/AdminTienDoToolbar";
import AdminTienDoTableSection from "./components/AdminTienDoTableSection";
import AdminTienDoViewPopup from "./components/AdminTienDoViewPopup";
import AdminTienDoEditModal from "./components/AdminTienDoEditModal";

export default function AdminTienDoThucTapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ListRow[]>([]);
  const [progressStats, setProgressStats] = useState<{
    notStarted: number;
    doing: number;
    selfFinanced: number;
    approvedReport: number;
    completed: number;
    notCompletedInternship: number;
  } | null>(null);

  const [faculties, setFaculties] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterDegree, setFilterDegree] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // includes APPROVED_REPORT

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Detail | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Detail | null>(null);
  const [finalStatusDraft, setFinalStatusDraft] = useState<"COMPLETED" | "REJECTED">("COMPLETED");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const fetchProgressDetailCached = async (id: string, force = false) =>
    getOrFetchCached<any>(
      `admin:tien-do:detail:${id}`,
      async () => {
        const res = await fetch(`/api/admin/tien-do-thuc-tap/${id}`);
        const payload = await res.json();
        if (!res.ok || !payload?.success || !payload?.item) {
          throw new Error(payload?.message || "Không thể tải thông tin tiến độ.");
        }
        return payload;
      },
      { force }
    );

  async function load() {
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (filterFaculty !== "all") sp.set("faculty", filterFaculty);
      if (filterDegree !== "all") sp.set("degree", filterDegree);
      if (filterStatus !== "all") sp.set("status", filterStatus);
      const url = `/api/admin/tien-do-thuc-tap?${sp.toString()}`;
      const cacheKey = `admin:tien-do:list:${url}`;
      if (!hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || "Không thể tải dữ liệu.");
          return payload;
        }
      );

      setItems(Array.isArray(data.items) ? data.items : []);
      setFaculties(Array.isArray(data.faculties) ? data.faculties : []);
      setProgressStats(data.progressStats ?? null);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu.");
      setProgressStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function openView(row: ListRow) {
    try {
      const data = await fetchProgressDetailCached(row.id);
      setViewTarget(data.item as Detail);
      setViewOpen(true);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không thể tải thông tin tiến độ.");
    }
  }

  async function openEdit(row: ListRow) {
    if (!row.canFinalUpdate) return;
    try {
      const data = await fetchProgressDetailCached(row.id);
      setEditTarget(data.item as Detail);
      setFinalStatusDraft("COMPLETED");
      setEditOpen(true);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không thể tải thông tin để cập nhật.");
    }
  }

  async function submitEdit() {
    if (!editTarget) return;
    if (!editTarget.ui.canFinalUpdate) return;

    setBusyId(editTarget.student.id);
    try {
      const res = await fetch(`/api/admin/tien-do-thuc-tap/${editTarget.student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalStatus: finalStatusDraft })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Cập nhật thất bại.");

      setEditOpen(false);
      setToast(data?.message || "Cập nhật thành công.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Cập nhật thất bại.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!items.length) return;
    void Promise.allSettled(items.map((row) => fetchProgressDetailCached(row.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tiến độ thực tập</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && progressStats ? (
        <section aria-label="Thống kê trạng thái thực tập">
          <div className={styles.statsGrid3}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Chưa thực tập</p>
              <p className={styles.statValue}>{progressStats.notStarted}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Đang thực tập</p>
              <p className={styles.statValue}>{progressStats.doing}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Thực tập tự túc</p>
              <p className={styles.statValue}>{progressStats.selfFinanced}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Đã hoàn thành BCTT</p>
              <p className={styles.statValue}>{progressStats.approvedReport}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Hoàn thành thực tập</p>
              <p className={styles.statValue}>{progressStats.completed}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Chưa hoàn thành thực tập</p>
              <p className={styles.statValue}>{progressStats.notCompletedInternship}</p>
            </div>
          </div>
        </section>
      ) : null}

      <AdminTienDoToolbar
        q={q}
        filterFaculty={filterFaculty}
        filterStatus={filterStatus}
        filterDegree={filterDegree}
        faculties={faculties}
        onChangeQ={setQ}
        onChangeFilterFaculty={setFilterFaculty}
        onChangeFilterStatus={setFilterStatus}
        onChangeFilterDegree={setFilterDegree}
        onSearch={() => void load()}
      />

      <AdminTienDoTableSection
        loading={loading}
        items={items}
        page={page}
        busyId={busyId}
        onPageChange={setPage}
        onView={(row) => void openView(row)}
        onEdit={(row) => void openEdit(row)}
      />

      <AdminTienDoViewPopup
        open={viewOpen}
        item={viewTarget}
        onClose={() => { setViewOpen(false); setViewTarget(null); }}
      />

      <AdminTienDoEditModal
        open={editOpen}
        item={editTarget}
        finalStatusDraft={finalStatusDraft}
        busy={busyId !== null}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSubmit={() => void submitEdit()}
        onChangeFinalStatus={setFinalStatusDraft}
      />

      {toast ? (
        <MessagePopup
          open
          title="Thông báo"
          message={toast}
          onClose={() => setToast("")}
          actions={
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setToast("")}>
              Đóng
            </button>
          }
        />
      ) : null}
    </main>
  );
}

