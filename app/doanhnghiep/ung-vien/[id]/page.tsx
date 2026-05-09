"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../styles/dashboard.module.css";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import MessagePopup from "../../../components/MessagePopup";
import FormPopup from "../../../components/FormPopup";
import Pagination from "../../../components/Pagination";

type WorkType = "PART_TIME" | "FULL_TIME";
type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

type JobApplicationStatus = "PENDING_REVIEW" | "INTERVIEW_INVITED" | "OFFERED" | "REJECTED" | "STUDENT_DECLINED";
type JobApplicationResponse = "PENDING" | "ACCEPTED" | "DECLINED";

type Applicant = {
  id: string;
  appliedAt: string | null;
  status: JobApplicationStatus;
  coverLetter: string | null;
  cvUrl: string | null;
  interviewAt: string | null;
  response: JobApplicationResponse;
  responseAt: string | null;
  history: any;
  student: { id: string; fullName: string; email: string; phone: string | null };
};

type JobDetail = {
  id: string;
  title: string;
  salary: string;
  expertise: string;
  experienceRequirement: string;
  workType: WorkType;
  jobDescription: string;
  candidateRequirements: string;
  workLocation: string;
  workTime: string;
  benefits: string;
  applicationMethod: string | null;
  createdAt: string | null;
  deadlineAt: string | null;
  recruitmentCount: number;
  status: JobStatus;
};

const applicationStatusLabel: Record<JobApplicationStatus, string> = {
  PENDING_REVIEW: "Chờ xem xét",
  INTERVIEW_INVITED: "Mời phỏng vấn",
  OFFERED: "Trúng tuyển",
  REJECTED: "Từ chối",
  STUDENT_DECLINED: "Ứng viên từ chối"
};

const responseLabel: Record<JobApplicationResponse, string> = {
  PENDING: "Chờ phản hồi",
  ACCEPTED: "Đồng ý",
  DECLINED: "Từ chối"
};

const workTypeLabel: Record<WorkType, string> = { PART_TIME: "Bán thời gian", FULL_TIME: "Toàn thời gian" };

function formatDateTimeVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function DoanhNghiepUngVienDetailPage({ params }: { params: { id: string } }) {
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return applicants.slice(start, start + PAGE_SIZE);
  }, [applicants, page]);

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
    } catch (e: any) {
      setError(e?.message || "Không thể tải chi tiết tin tuyển dụng.");
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

  async function submitUpdateStatus() {
    if (!editTarget) return;
    if (nextStatus === "INTERVIEW_INVITED" && !interviewAt) {
      setToast("Vui lòng nhập thời gian mời phỏng vấn.");
      return;
    }
    setBusy(true);
    try {
      const payload: any = { status: nextStatus };
      if (nextStatus === "INTERVIEW_INVITED") payload.interviewAt = new Date(interviewAt).toISOString();
      const res = await fetch(`/api/doanhnghiep/ung-vien/applications/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể cập nhật trạng thái hồ sơ.");
      setToast(data?.message || "Cập nhật trạng thái hồ sơ thành công.");
      setViewTarget(null);
      setEditTarget(null);
      await load();
    } catch (e: any) {
      setToast(e?.message || "Không thể cập nhật trạng thái hồ sơ.");
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
          <section className={adminStyles.detailCard} style={{ maxWidth: "none" }}>
            <div className={adminStyles.detailSectionTitle}>Thông tin tin tuyển dụng</div>
            <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 10 }}>
              <tbody>
                <tr>
                  <th scope="row">Tiêu đề</th>
                  <td>{job.title}</td>
                </tr>
                <tr>
                  <th scope="row">Mức lương</th>
                  <td>{job.salary}</td>
                </tr>
                <tr>
                  <th scope="row">Chuyên môn</th>
                  <td>{job.expertise}</td>
                </tr>
                <tr>
                  <th scope="row">Yêu cầu kinh nghiệm</th>
                  <td>{job.experienceRequirement}</td>
                </tr>
                <tr>
                  <th scope="row">Hình thức làm việc</th>
                  <td>{workTypeLabel[job.workType]}</td>
                </tr>
                <tr>
                  <th scope="row">Mô tả công việc</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{job.jobDescription}</td>
                </tr>
                <tr>
                  <th scope="row">Yêu cầu ứng viên</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{job.candidateRequirements}</td>
                </tr>
                <tr>
                  <th scope="row">Địa điểm làm việc</th>
                  <td>{job.workLocation}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: 16 }}>
            <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>
              Danh sách ứng viên ứng tuyển
            </div>

            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.dataTable}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ tên</th>
                    <th>SĐT</th>
                    <th>Email</th>
                    <th>Trạng thái phản hồi</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.modulePlaceholder}>
                        Chưa có ứng viên ứng tuyển.
                      </td>
                    </tr>
                  ) : (
                    paged.map((a, idx) => (
                      <tr key={a.id}>
                        <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td data-label="Họ tên">{a.student.fullName}</td>
                        <td data-label="SĐT">{a.student.phone ?? "—"}</td>
                        <td data-label="Email">{a.student.email}</td>
                        <td data-label="Trạng thái phản hồi">
                          {applicationStatusLabel[a.status]} • {responseLabel[a.response]}
                        </td>
                        <td data-label="Thao tác">
                          <button type="button" className={adminStyles.textLinkBtn} onClick={() => openApplicant(a)} disabled={busy}>
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={applicants.length}
              onPageChange={setPage}
              buttonClassName={adminStyles.btn}
              activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            />
          </section>
        </>
      ) : null}

      {viewTarget ? (
        <FormPopup
          open
          title="Xem chi tiết ứng viên"
          size="extraWide"
          busy={busy}
          onClose={() => {
            setViewTarget(null);
            setEditTarget(null);
          }}
          actions={
            <>
              <button
                type="button"
                className={adminStyles.btn}
                onClick={() => {
                  setViewTarget(null);
                  setEditTarget(null);
                }}
                disabled={busy}
              >
                Đóng
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void submitUpdateStatus()} disabled={busy}>
                Lưu
              </button>
            </>
          }
        >
          <table className={adminStyles.viewModalDetailTable}>
            <tbody>
              <tr>
                <th scope="row">Họ tên</th>
                <td>{viewTarget.student.fullName}</td>
              </tr>
              <tr>
                <th scope="row">SĐT</th>
                <td>{viewTarget.student.phone ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{viewTarget.student.email}</td>
              </tr>
              <tr>
                <th scope="row">Thư giới thiệu bản thân</th>
                <td style={{ whiteSpace: "pre-wrap" }}>{viewTarget.coverLetter || "—"}</td>
              </tr>
              <tr>
                <th scope="row">File CV đính kèm</th>
                <td>{viewTarget.cvUrl ? <a className={adminStyles.detailLink} href={viewTarget.cvUrl}>Tải CV</a> : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Lịch sử phản hồi</th>
                <td>
                  {Array.isArray(viewTarget.history) && viewTarget.history.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {viewTarget.history.slice().reverse().map((h: any, idx: number) => (
                        <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTimeVi(h?.at || null)}</div>
                          <div style={{ fontSize: 13 }}>
                            {h?.action === "STATUS_UPDATE" ? (
                              <>
                                Cập nhật trạng thái: <b>{h?.from}</b> → <b>{h?.to}</b>
                                {h?.interviewAt ? <span> • Phỏng vấn: <b>{formatDateTimeVi(h?.interviewAt)}</b></span> : null}
                              </>
                            ) : (
                              JSON.stringify(h)
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Cập nhật trạng thái</th>
                <td>
                  <div style={{ display: "grid", gap: 10 }}>
                    <select className={adminStyles.selectInput} value={nextStatus} onChange={(e) => setNextStatus(e.target.value as any)} disabled={busy}>
                      <option value="PENDING_REVIEW">Chờ xem xét</option>
                      <option value="INTERVIEW_INVITED">Mời phỏng vấn</option>
                      <option value="OFFERED">Trúng tuyển</option>
                      <option value="REJECTED">Từ chối</option>
                    </select>

                    {nextStatus === "INTERVIEW_INVITED" ? (
                      <div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Thời gian mời phỏng vấn</div>
                        <input
                          className={adminStyles.textInputSearch}
                          type="datetime-local"
                          value={interviewAt}
                          onChange={(e) => setInterviewAt(e.target.value)}
                          disabled={busy}
                        />
                      </div>
                    ) : null}

                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Trạng thái hiện tại: <b>{applicationStatusLabel[viewTarget.status]}</b> • Ứng viên: <b>{responseLabel[viewTarget.response]}</b>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </FormPopup>
      ) : null}

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

