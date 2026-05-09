"use client";

import { useEffect, useState } from "react";
import styles from "../../styles/dashboard.module.css";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import MessagePopup from "../../../components/MessagePopup";
import type { Applicant, JobApplicationStatus, JobDetail } from "@/lib/types/doanhnghiep-ung-vien-detail";
import JobDetailInfo from "./components/JobDetailInfo";
import ApplicantTableSection from "./components/ApplicantTableSection";
import ApplicantDetailPopup from "./components/ApplicantDetailPopup";

export default function DoanhNghiepUngVienDetailPage({ params }: { params: { id: string } }) {
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");

  const [viewTarget, setViewTarget] = useState<Applicant | null>(null);
  const [editTarget, setEditTarget] = useState<Applicant | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState<JobApplicationStatus>("PENDING_REVIEW");
  const [interviewAt, setInterviewAt] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/doanhnghiep/ung-vien/${jobId}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải chi tiết tin tuyển dụng.");
      setJob(data.job ?? null);
      setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
      setPage(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải chi tiết tin tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  function openApplicant(app: Applicant) {
    setViewTarget(app);
    setEditTarget(app);
    setNextStatus(app.status);
    setInterviewAt(app.interviewAt ? new Date(app.interviewAt).toISOString().slice(0, 16) : "");
  }

  const closeApplicant = () => {
    setViewTarget(null);
    setEditTarget(null);
  };

  async function submitUpdateStatus() {
    if (!editTarget) return;
    if (nextStatus === "INTERVIEW_INVITED" && !interviewAt) {
      setToast("Vui lòng nhập thời gian mời phỏng vấn.");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === "INTERVIEW_INVITED") payload.interviewAt = new Date(interviewAt).toISOString();
      const res = await fetch(`/api/doanhnghiep/ung-vien/applications/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể cập nhật trạng thái hồ sơ.");
      setToast(data?.message || "Cập nhật trạng thái hồ sơ thành công.");
      closeApplicant();
      await load();
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Không thể cập nhật trạng thái hồ sơ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Xem chi tiết</h1>
        <p className={styles.subtitle}>
          <a className={adminStyles.detailLink} href="/doanhnghiep/ung-vien">
            ← Quay lại danh sách
          </a>
        </p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : job ? (
        <>
          <JobDetailInfo job={job} />
          <ApplicantTableSection
            applicants={applicants}
            page={page}
            busy={busy}
            onView={openApplicant}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <ApplicantDetailPopup
        viewTarget={viewTarget}
        busy={busy}
        nextStatus={nextStatus}
        interviewAt={interviewAt}
        onNextStatusChange={setNextStatus}
        onInterviewAtChange={setInterviewAt}
        onClose={closeApplicant}
        onSave={() => void submitUpdateStatus()}
      />

      {toast ? (
        <MessagePopup
          open
          title="Thông báo"
          onClose={() => setToast("")}
          actions={
            <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => setToast("")}>
              Đóng
            </button>
          }
        >
          {toast}
        </MessagePopup>
      ) : null}
    </main>
  );
}
