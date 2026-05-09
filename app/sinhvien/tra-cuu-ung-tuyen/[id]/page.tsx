"use client";

import { useEffect, useState } from "react";
import styles from "../../styles/dashboard.module.css";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";
import MessagePopup from "../../../components/MessagePopup";
import FormPopup from "../../../components/FormPopup";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";

type WorkType = "PART_TIME" | "FULL_TIME";
type InternshipStatus = "NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED";

type JobDetail = {
  id: string;
  title: string;
  salary: string;
  expertise: string;
  experienceRequirement: string;
  recruitmentCount: number;
  workType: WorkType;
  deadlineAt: string | null;
  jobDescription: string;
  candidateRequirements: string;
  benefits: string;
  workLocation: string;
  workTime: string;
  applicationMethod: string | null;
  enterprise: {
    companyName: string;
    taxCode: string;
    businessFields: string;
    headquartersAddress: string;
    intro: string | null;
    website: string | null;
  };
  canApply: boolean;
  hasApplied: boolean;
  internshipStatus: InternshipStatus;
};

const PHONE_PATTERN = /^\d{8,12}$/;
const CV_ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const workTypeLabel: Record<WorkType, string> = { PART_TIME: "Part-time", FULL_TIME: "Full-time" };

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function SinhVienJobDetailPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [job, setJob] = useState<JobDetail | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvMime, setCvMime] = useState<string | null>(null);
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [removeCv, setRemoveCv] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sinhvien/tra-cuu-ung-tuyen/${jobId}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải chi tiết tin tuyển dụng.");
      setJob(data.item ?? null);
    } catch (e: any) {
      setError(e?.message || "Không thể tải chi tiết tin tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfileForApply() {
    const res = await fetch("/api/sinhvien/ho-so-sinh-vien");
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải hồ sơ sinh viên.");
    const item = data.item ?? {};
    setFullName(item.fullName || "");
    setPhone(item.phone || "");
    setEmail(item.email || "");
    setIntro(item.intro || "");
    setCvFileName(item.cvFileName || null);
    setCvMime(item.cvMime || null);
    setCvBase64(item.cvBase64 || null);
    setRemoveCv(false);
    setFieldErrors({});
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function openApply() {
    try {
      await loadProfileForApply();
      setApplyOpen(true);
    } catch (e: any) {
      setToast(e?.message || "Không thể mở popup ứng tuyển.");
    }
  }

  async function onChooseCv(file: File | null) {
    if (!file) return;
    const guessed = file.type || "";
    if (!CV_ALLOWED.includes(guessed)) {
      setFieldErrors((prev) => ({ ...prev, cv: "File CV chỉ chấp nhận định dạng PDF, DOC, DOCX." }));
      return;
    }
    const payload = await readFileAsBase64Payload(file);
    if (!CV_ALLOWED.includes(payload.mime)) {
      setFieldErrors((prev) => ({ ...prev, cv: "File CV chỉ chấp nhận định dạng PDF, DOC, DOCX." }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, cv: "" }));
    setCvFileName(file.name);
    setCvMime(payload.mime);
    setCvBase64(payload.base64);
    setRemoveCv(false);
  }

  async function submitApply() {
    const nextErrors: Record<string, string> = {};
    if (!PHONE_PATTERN.test(phone.trim())) nextErrors.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
    if (!AUTH_EMAIL_REGISTER_PATTERN.test(email.trim().toLowerCase())) nextErrors.email = "Email không đúng định dạng.";
    if (!intro.trim()) nextErrors.intro = "Thư giới thiệu bản thân bắt buộc.";
    if (!cvBase64 || !cvMime || !cvFileName || removeCv) nextErrors.cv = "Vui lòng đính kèm file CV.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/sinhvien/tra-cuu-ung-tuyen/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          intro: intro.trim(),
          cvFileName,
          cvMime,
          cvBase64,
          removeCv
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors && typeof data.errors === "object") setFieldErrors(data.errors);
        throw new Error(data?.message || "Nộp hồ sơ ứng tuyển thất bại.");
      }
      setApplyOpen(false);
      setToast(data?.message || "Nộp hồ sơ ứng tuyển thành công.");
      await loadDetail();
    } catch (e: any) {
      setToast(e?.message || "Nộp hồ sơ ứng tuyển thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chi tiết tin tuyển dụng</h1>
        <p className={styles.subtitle}>
          <a className={adminStyles.detailLink} href="/sinhvien/tra-cuu-ung-tuyen">
            ← Quay lại danh sách
          </a>
        </p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : job ? (
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <div className={adminStyles.detailSectionTitle}>Thông tin tuyển dụng</div>
          <table className={adminStyles.viewModalDetailTable}>
            <tbody>
              <tr><th scope="row">Tiêu đề</th><td>{job.title}</td></tr>
              <tr><th scope="row">Tên doanh nghiệp</th><td>{job.enterprise.companyName}</td></tr>
              <tr><th scope="row">MST</th><td>{job.enterprise.taxCode}</td></tr>
              <tr><th scope="row">Lĩnh vực</th><td>{job.enterprise.businessFields}</td></tr>
              <tr><th scope="row">Địa điểm trụ sở chính</th><td>{job.enterprise.headquartersAddress}</td></tr>
              <tr><th scope="row">Giới thiệu công ty</th><td>{job.enterprise.intro || "—"}</td></tr>
              <tr><th scope="row">Website</th><td>{job.enterprise.website || "—"}</td></tr>
              <tr><th scope="row">Mức lương</th><td>{job.salary}</td></tr>
              <tr><th scope="row">Chuyên môn</th><td>{job.expertise}</td></tr>
              <tr><th scope="row">Yêu cầu kinh nghiệm</th><td>{job.experienceRequirement}</td></tr>
              <tr><th scope="row">Số lượng tuyển dụng</th><td>{job.recruitmentCount}</td></tr>
              <tr><th scope="row">Hình thức làm việc</th><td>{workTypeLabel[job.workType]}</td></tr>
              <tr><th scope="row">Hạn tuyển dụng</th><td>{formatDateVi(job.deadlineAt)}</td></tr>
              <tr><th scope="row">Mô tả công việc</th><td style={{ whiteSpace: "pre-wrap" }}>{job.jobDescription}</td></tr>
              <tr><th scope="row">Yêu cầu ứng viên</th><td style={{ whiteSpace: "pre-wrap" }}>{job.candidateRequirements}</td></tr>
              <tr><th scope="row">Quyền lợi</th><td style={{ whiteSpace: "pre-wrap" }}>{job.benefits}</td></tr>
              <tr><th scope="row">Địa điểm làm việc</th><td>{job.workLocation}</td></tr>
              <tr><th scope="row">Thời gian làm việc</th><td>{job.workTime}</td></tr>
              <tr><th scope="row">Cách thức ứng tuyển</th><td>{job.applicationMethod || "Ứng tuyển trực tiếp trên hệ thống"}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 14 }}>
            <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void openApply()} disabled={!job.canApply || job.hasApplied}>
              {job.hasApplied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
            </button>
          </div>
        </section>
      ) : null}

      {applyOpen ? (
        <FormPopup
          open
          title="Cập nhật hồ sơ sinh viên"
          size="wide"
          busy={busy}
          onClose={() => setApplyOpen(false)}
          actions={
            <>
              <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => setApplyOpen(false)}>
                Hủy
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={() => void submitApply()}>
                Nộp hồ sơ ứng tuyển
              </button>
            </>
          }
        >
          <div className={formStyles.section}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Họ tên</label>
              <input className={formStyles.input} value={fullName} disabled />
            </div>
            <div className={formStyles.grid2}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>SĐT</label>
                <input className={formStyles.input} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
                {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Email</label>
                <input className={formStyles.input} value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
                {fieldErrors.email ? <p className={formStyles.error}>{fieldErrors.email}</p> : null}
              </div>
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Thư giới thiệu bản thân</label>
              <textarea className={formStyles.textarea} value={intro} onChange={(e) => setIntro(e.target.value)} disabled={busy} />
              {fieldErrors.intro ? <p className={formStyles.error}>{fieldErrors.intro}</p> : null}
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>File CV đính kèm</label>
              <input
                className={formStyles.input}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void onChooseCv(f);
                }}
              />
              {cvBase64 && cvMime && cvFileName && !removeCv ? (
                <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <a className={adminStyles.detailLink} href={dataUrlFromBase64(cvMime, cvBase64)} download={cvFileName}>
                    {cvFileName}
                  </a>
                  <button
                    type="button"
                    className={adminStyles.textLinkBtn}
                    onClick={() => {
                      setRemoveCv(true);
                      setCvBase64(null);
                      setCvMime(null);
                      setCvFileName(null);
                    }}
                  >
                    Xóa file
                  </button>
                </div>
              ) : null}
              {fieldErrors.cv ? <p className={formStyles.error}>{fieldErrors.cv}</p> : null}
            </div>
          </div>
        </FormPopup>
      ) : null}

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

