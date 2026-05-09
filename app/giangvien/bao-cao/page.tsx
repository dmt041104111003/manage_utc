"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type { Degree, InternshipStatus, Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { validateGiangVienBaoCaoApprove } from "@/lib/utils/giangvien-bao-cao-thuc-tap";
import BaoCaoToolbar from "./components/BaoCaoToolbar";
import BaoCaoTableSection from "./components/BaoCaoTableSection";
import BaoCaoViewPopup from "./components/BaoCaoViewPopup";
import BaoCaoUpdatePopup from "./components/BaoCaoUpdatePopup";
import BaoCaoReviewPopup from "./components/BaoCaoReviewPopup";

export default function GiangvienQuanLyBCPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<"all" | Degree>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InternshipStatus>("all");

  const [rows, setRows] = useState<Row[]>([]);
  const [toast, setToast] = useState("");

  const [viewTarget, setViewTarget] = useState<Row | null>(null);

  const [updateTarget, setUpdateTarget] = useState<Row | null>(null);

  const [reviewTarget, setReviewTarget] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [dqtPoint, setDqtPoint] = useState("");
  const [kthpPoint, setKthpPoint] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (degreeFilter !== "all") sp.set("degree", degreeFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách BCTT.");
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách BCTT.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitUpdateInternship() {
    if (!updateTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/update-internship-status/${updateTarget.studentProfileId}`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Cập nhật thất bại.");
      setUpdateTarget(null);
      setToast(data?.message || "Cập nhật thành công.");
      await load();
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function submitApprove() {
    if (!reviewTarget?.report) return;
    const err = validateGiangVienBaoCaoApprove({ reviewTarget, evaluation, dqtPoint, kthpPoint });
    if (err) { setToast(err); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/${reviewTarget.report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          supervisorEvaluation: evaluation.trim() || null,
          supervisorPoint: Number(dqtPoint.trim()),
          enterpriseEvaluation: null,
          enterprisePoint: reviewTarget.enterprise ? Number(kthpPoint.trim()) : null
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Duyệt thất bại.");
      setReviewTarget(null);
      setToast(data?.message || "Duyệt thành công.");
      await load();
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Duyệt thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReject() {
    if (!reviewTarget?.report) return;
    const rr = rejectReason.trim();
    if (!rr) { setToast("Lý do từ chối là bắt buộc."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/${reviewTarget.report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectReason: rr })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Từ chối thất bại.");
      setReviewTarget(null);
      setRejectReason("");
      setEvaluation("");
      setDqtPoint("");
      setKthpPoint("");
      setToast(data?.message || "Từ chối thành công.");
      await load();
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Từ chối thất bại.");
    } finally {
      setBusy(false);
    }
  }

  const openReview = (r: Row) => {
    setReviewTarget(r);
    setRejectReason("");
    setEvaluation(r.report?.supervisorEvaluation ?? "");
    setDqtPoint(r.report?.supervisorPoint != null ? String(r.report.supervisorPoint) : "");
    setKthpPoint(r.report?.enterprisePoint != null ? String(r.report.enterprisePoint) : "");
  };

  const closeReview = () => {
    setReviewTarget(null);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý BCTT</h1>
        <p className={styles.subtitle}>Duyệt/từ chối BCTT và cập nhật trạng thái thực tập cho sinh viên được phân công.</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <BaoCaoToolbar
        q={q}
        degreeFilter={degreeFilter}
        statusFilter={statusFilter}
        onQChange={setQ}
        onDegreeFilterChange={setDegreeFilter}
        onStatusFilterChange={setStatusFilter}
        onSearch={() => void load()}
      />

      <BaoCaoTableSection
        loading={loading}
        rows={rows}
        busy={busy}
        onView={setViewTarget}
        onUpdate={setUpdateTarget}
        onReview={openReview}
      />

      <BaoCaoViewPopup
        viewTarget={viewTarget}
        onClose={() => setViewTarget(null)}
      />

      <BaoCaoUpdatePopup
        updateTarget={updateTarget}
        busy={busy}
        onConfirm={() => void submitUpdateInternship()}
        onCancel={() => setUpdateTarget(null)}
      />

      <BaoCaoReviewPopup
        reviewTarget={reviewTarget}
        busy={busy}
        evaluation={evaluation}
        dqtPoint={dqtPoint}
        kthpPoint={kthpPoint}
        rejectReason={rejectReason}
        onEvaluationChange={setEvaluation}
        onDqtPointChange={setDqtPoint}
        onKthpPointChange={setKthpPoint}
        onRejectReasonChange={setRejectReason}
        onApprove={() => void submitApprove()}
        onReject={() => void submitReject()}
        onClose={closeReview}
      />

      {toast ? (
        <MessagePopup
          open
          title="Thông báo"
          message={toast}
          onClose={() => setToast("")}
          actions={
            <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => setToast("")}>
              Đóng
            </button>
          }
        />
      ) : null}
    </main>
  );
}
