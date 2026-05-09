"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../../styles/dashboard.module.css";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import MessagePopup from "../../../components/MessagePopup";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";
import type { Applicant, JobApplicationStatus, JobDetail } from "@/lib/types/doanhnghiep-ung-vien-detail";
import { getAvailableNextStatuses } from "@/lib/types/doanhnghiep-ung-vien-detail";
import JobDetailInfo from "./components/JobDetailInfo";
import ApplicantTableSection from "./components/ApplicantTableSection";
import { DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE } from "@/lib/constants/doanhnghiep-ung-vien-detail";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
const ApplicantDetailPopup = dynamic(() => import("./components/ApplicantDetailPopup"), { ssr: false });

export default function DoanhNghiepUngVienDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const page1CacheKey = `enterprise:ung-vien:detail:${jobId}:1`;

  const [loading, setLoading] = useState(() => !hasCachedValue(page1CacheKey));
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobDetail | null>(() => getCachedValue<{ job?: JobDetail | null }>(page1CacheKey)?.job ?? null);
  const [applicants, setApplicants] = useState<Applicant[]>(() => getCachedValue<{ applicants?: Applicant[] }>(page1CacheKey)?.applicants ?? []);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(() => Number(getCachedValue<{ totalItems?: number }>(page1CacheKey)?.totalItems || 0));
  const [toast, setToast] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | "">("");

  const [viewTarget, setViewTarget] = useState<Applicant | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState<JobApplicationStatus>("PENDING_REVIEW");
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");

  async function load(nextPage = 1, opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(nextPage));
      qs.set("pageSize", String(DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE));
      if (query.trim()) qs.set("q", query.trim());
      if (statusFilter) qs.set("status", statusFilter);
      const url = `/api/doanhnghiep/ung-vien/${jobId}?${qs.toString()}`;
      const cacheKey = `enterprise:ung-vien:detail:${jobId}:${nextPage}:q=${query.trim()}:status=${statusFilter || "all"}`;
      if (!silent && !hasCachedValue(cacheKey)) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        cacheKey,
        async () => {
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || "Không thể tải chi tiết tin tuyển dụng.");
          return payload;
        },
        { force }
      );
      setJob(data.job ?? null);
      setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
      setTotalItems(Number(data.totalItems || 0));
      setPage(nextPage);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải chi tiết tin tuyển dụng.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load(1, { force: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, jobId]);

  useEffect(() => {
    const timer = setInterval(() => {
      void load(page, { force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, jobId]);

  function openApplicant(app: Applicant) {
    setViewTarget(app);
    const available = getAvailableNextStatuses(app.status, app.response);
    setNextStatus(available.length ? available[0] : app.status);
    setInterviewAt(app.interviewAt ? new Date(app.interviewAt).toISOString().slice(0, 16) : "");
    setInterviewLocation(app.interviewLocation ?? "");
    setResponseDeadline(app.responseDeadline ? new Date(app.responseDeadline).toISOString().slice(0, 16) : "");
  }

  const closeApplicant = () => {
    setViewTarget(null);
  };

  async function submitUpdateStatus() {
    if (!viewTarget) return;

    const available = getAvailableNextStatuses(viewTarget.status, viewTarget.response);
    if (!available.includes(nextStatus)) {
      setToast("Trạng thái cập nhật không hợp lệ.");
      return;
    }

    if (nextStatus === "INTERVIEW_INVITED") {
      if (!interviewAt) { setToast("Vui lòng nhập thời gian phỏng vấn."); return; }
      if (!interviewLocation.trim()) { setToast("Vui lòng nhập địa điểm phỏng vấn."); return; }
      if (!responseDeadline) { setToast("Vui lòng nhập thời hạn phản hồi."); return; }
    }
    if (nextStatus === "OFFERED") {
      if (!responseDeadline) { setToast("Vui lòng nhập thời hạn phản hồi."); return; }
    }

    setBusy(true);
    try {
      const payload: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === "INTERVIEW_INVITED") {
        payload.interviewAt = new Date(interviewAt).toISOString();
        payload.interviewLocation = interviewLocation.trim();
        payload.responseDeadline = new Date(responseDeadline).toISOString();
      }
      if (nextStatus === "OFFERED") {
        payload.responseDeadline = new Date(responseDeadline).toISOString();
      }
      const res = await fetch(`/api/doanhnghiep/ung-vien/applications/${viewTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể cập nhật trạng thái hồ sơ.");
      setToast(data?.message || "Cập nhật trạng thái hồ sơ thành công.");
      closeApplicant();
      await load(page, { force: true });
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
          <Link className={adminStyles.detailLink} href="/doanhnghiep/ung-vien">
            ← Quay lại danh sách
          </Link>
        </p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading && !job ? (
        <ChartStyleLoading variant="block" />
      ) : job ? (
        <>
          <JobDetailInfo job={job} />
          <ApplicantTableSection
            applicants={applicants}
            totalItems={totalItems}
            page={page}
            busy={busy}
            query={query}
            status={statusFilter}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            onView={openApplicant}
            onPageChange={(p) => void load(p, { force: true })}
          />
        </>
      ) : null}

      <ApplicantDetailPopup
        viewTarget={viewTarget}
        busy={busy}
        nextStatus={nextStatus}
        interviewAt={interviewAt}
        interviewLocation={interviewLocation}
        responseDeadline={responseDeadline}
        onNextStatusChange={setNextStatus}
        onInterviewAtChange={setInterviewAt}
        onInterviewLocationChange={setInterviewLocation}
        onResponseDeadlineChange={setResponseDeadline}
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
