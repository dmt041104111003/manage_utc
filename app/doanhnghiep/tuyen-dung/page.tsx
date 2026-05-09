"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import Pagination from "../../components/Pagination";
import { DOANHNGHIEP_REGISTER_WEBSITE_PATTERN } from "@/lib/constants/doanhnghiep";
import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import { metaRecord } from "@/lib/utils/enterprise-meta";

type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";
type WorkType = "PART_TIME" | "FULL_TIME";

type JobListItem = {
  id: string;
  title: string;
  createdAt: string | null;
  recruitmentCount: number;
  expertise: string;
  workType: WorkType;
  status: JobStatus;
  deadlineAt: string | null;
};

type JobDetailResponse = {
  job: any;
  enterprise: {
    companyName: string | null;
    taxCode: string | null;
    businessFields: string;
    headquartersAddress: string;
    intro: string | null;
    website: string | null;
  };
};

type ApiResponse<T> = { success: boolean; message?: string; item?: T; items?: any; hasOpenBatch?: boolean; batchId?: string | null; errors?: Record<string, string> };

const statusLabel: Record<JobStatus, string> = {
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối duyệt",
  ACTIVE: "Đang hoạt động",
  STOPPED: "Dừng hoạt động"
};

const workTypeLabel: Record<WorkType, string> = {
  PART_TIME: "part-time",
  FULL_TIME: "full-time"
};

const TITLE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const EXPERTISE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const SALARY_PATTERN = /^[\p{L}\d\s\-]{1,150}$/u;
const COUNT_PATTERN = /^\d{1,10}$/;

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateVi(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

type JobFormState = {
  title: string;
  companyIntro: string;
  companyWebsite: string;
  salary: string;
  expertise: string;
  experienceRequirement: string;
  recruitmentCount: string;
  workType: WorkType | "";
  deadlineAt: string; // yyyy-mm-dd
  jobDescription: string;
  candidateRequirements: string;
  benefits: string;
  workLocation: string;
  workTime: string;
  applicationMethod: string;
};

const EMPTY_FORM: JobFormState = {
  title: "",
  companyIntro: "",
  companyWebsite: "",
  salary: "",
  expertise: "",
  experienceRequirement: "",
  recruitmentCount: "",
  workType: "",
  deadlineAt: todayDateInputValue(),
  jobDescription: "",
  candidateRequirements: "",
  benefits: "",
  workLocation: "",
  workTime: "",
  applicationMethod: ""
};

export default function DoanhNghiepTuyenDungPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JobListItem[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStatus, setSearchStatus] = useState<"all" | JobStatus>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [viewJob, setViewJob] = useState<JobDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [stopTarget, setStopTarget] = useState<JobListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobListItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobListItem | null>(null);
  const [editDetail, setEditDetail] = useState<JobDetailResponse | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [enterpriseDefaults, setEnterpriseDefaults] = useState<{ intro: string; website: string }>({ intro: "", website: "" });

  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadEnterpriseDefaults = async () => {
    const res = await fetch("/api/doanhnghiep/me");
    const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
    if (!res.ok || !data.success || !data.item) return;
    const m = metaRecord(data.item.enterpriseMeta);
    const intro =
      Array.isArray(m.businessFields) ? m.businessFields.map(String).join(", ") : "";
    const website = typeof m.website === "string" ? m.website : "";
    setEnterpriseDefaults({ intro, website });
  };

  const load = async (params?: { q?: string; date?: string; status?: string }) => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const url = new URL("/api/doanhnghiep/tuyen-dung", window.location.origin);
      if (params?.q !== undefined) url.searchParams.set("q", params.q || "");
      if (params?.date) url.searchParams.set("date", params.date);
      if (params?.status && params.status !== "all") url.searchParams.set("status", params.status);
      const res = await fetch(url.toString());
      const data = (await res.json()) as ApiResponse<JobListItem[]>;
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được tin tuyển dụng.");
      setItems((data.items || []) as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const pagedItems = items.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  const refresh = async () => {
    await load({ q: searchQ, date: searchDate, status: searchStatus });
  };

  useEffect(() => {
    void (async () => {
      await loadEnterpriseDefaults();
      await load({ q: searchQ, date: searchDate, status: searchStatus });
    })();
  }, []);

  const dismissToast = () => setToast("");

  const resetFormForAdd = () => {
    setFieldErrors({});
    setForm({
      ...EMPTY_FORM,
      companyIntro: enterpriseDefaults.intro || "",
      companyWebsite: enterpriseDefaults.website || "",
      deadlineAt: todayDateInputValue()
    });
  };

  const resetFormForEdit = (detail: JobDetailResponse) => {
    setFieldErrors({});
    const job = detail.job;
    setForm({
      title: job.title || "",
      companyIntro: detail.job.companyIntro || enterpriseDefaults.intro || "",
      companyWebsite: detail.job.companyWebsite || enterpriseDefaults.website || "",
      salary: job.salary || "",
      expertise: job.expertise || "",
      experienceRequirement: job.experienceRequirement || "",
      recruitmentCount: job.recruitmentCount != null ? String(job.recruitmentCount) : "",
      workType: (job.workType as WorkType) || "",
      deadlineAt: job.deadlineAt ? new Date(job.deadlineAt).toISOString().slice(0, 10) : todayDateInputValue(),
      jobDescription: job.jobDescription || "",
      candidateRequirements: job.candidateRequirements || "",
      benefits: job.benefits || "",
      workLocation: job.workLocation || "",
      workTime: job.workTime || "",
      applicationMethod: job.applicationMethod || ""
    });
  };

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title || !TITLE_PATTERN.test(form.title.trim())) next.title = "Tiêu đề chỉ gồm ký tự chữ và số (1–255).";
    if (!form.salary || !SALARY_PATTERN.test(form.salary.trim())) next.salary = "Mức lương chỉ gồm chữ, số, '-' (1–150).";
    if (!form.expertise || !EXPERTISE_PATTERN.test(form.expertise.trim())) next.expertise = "Chuyên môn chỉ gồm chữ, số (1–255).";
    if (!form.experienceRequirement || !EXPERTISE_PATTERN.test(form.experienceRequirement.trim())) next.experienceRequirement = "Yêu cầu kinh nghiệm chỉ gồm chữ, số (1–255).";
    if (!form.recruitmentCount || !COUNT_PATTERN.test(form.recruitmentCount.trim())) next.recruitmentCount = "Số lượng tuyển dụng chỉ gồm số (1–10).";
    if (!form.workType || (form.workType !== "PART_TIME" && form.workType !== "FULL_TIME")) next.workType = "Hình thức làm việc không hợp lệ.";

    if (!form.deadlineAt || !/^\d{4}-\d{2}-\d{2}$/.test(form.deadlineAt)) next.deadlineAt = "Hạn tuyển dụng không hợp lệ.";
    else {
      const deadline = new Date(`${form.deadlineAt}T00:00:00.000Z`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!(deadline.getTime() > today.getTime())) next.deadlineAt = "Hạn tuyển dụng phải lớn hơn ngày hiện tại.";
    }

    if (!form.jobDescription.trim()) next.jobDescription = "Mô tả công việc bắt buộc.";
    if (!form.candidateRequirements.trim()) next.candidateRequirements = "Yêu cầu ứng viên bắt buộc.";
    if (!form.benefits.trim()) next.benefits = "Quyền lợi bắt buộc.";
    if (!form.workLocation.trim() || form.workLocation.trim().length > 255) next.workLocation = "Địa điểm làm việc bắt buộc và tối đa 255 ký tự.";
    if (!form.workTime.trim()) next.workTime = "Thời gian làm việc bắt buộc.";

    // optional website
    if (form.companyWebsite.trim() && !DOANHNGHIEP_REGISTER_WEBSITE_PATTERN.test(form.companyWebsite.trim())) next.companyWebsite = "Website không đúng định dạng.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const openView = async (row: JobListItem) => {
    setViewJob(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${row.id}`);
      const data = (await res.json()) as ApiResponse<JobDetailResponse>;
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được chi tiết tin tuyển dụng.");
      setViewJob(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = async (row: JobListItem) => {
    setEditTarget(row);
    setEditDetail(null);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${row.id}`);
      const data = (await res.json()) as ApiResponse<JobDetailResponse>;
      if (!res.ok || !data.success || !data.item) throw new Error(data.message || "Không tải được chi tiết tin tuyển dụng.");
      setEditDetail(data.item);
      resetFormForEdit(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Lỗi tải chi tiết.");
      setEditTarget(null);
    } finally {
      setEditLoading(false);
    }
  };

  const submitCreate = async () => {
    setFieldErrors({});
    if (!validateForm()) return;
    setBusyId("add");
    setToast("");
    try {
      const payload = {
        title: form.title.trim(),
        companyIntro: form.companyIntro.trim() || null,
        companyWebsite: form.companyWebsite.trim() || null,
        salary: form.salary.trim(),
        expertise: form.expertise.trim(),
        experienceRequirement: form.experienceRequirement.trim(),
        recruitmentCount: Number(form.recruitmentCount.trim()),
        workType: form.workType,
        deadlineAt: form.deadlineAt,
        jobDescription: form.jobDescription.trim(),
        candidateRequirements: form.candidateRequirements.trim(),
        benefits: form.benefits.trim(),
        workLocation: form.workLocation.trim(),
        workTime: form.workTime.trim(),
        applicationMethod: form.applicationMethod.trim() || null
      };

      const res = await fetch("/api/doanhnghiep/tuyen-dung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) {
        const maybeErrors = (data as any)?.errors as Record<string, string> | undefined;
        if (maybeErrors && typeof maybeErrors === "object") {
          setFieldErrors(maybeErrors);
          return;
        }
        setToast(data.message || "Tạo tin thất bại.");
        return;
      }
      setToast(data.message || "Tạo tin tuyển dụng thành công.");
      setAddOpen(false);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Tạo tin thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setFieldErrors({});
    if (!validateForm()) return;
    setBusyId(editTarget.id);
    setToast("");
    try {
      const payload = {
        title: form.title.trim(),
        companyIntro: form.companyIntro.trim() || null,
        companyWebsite: form.companyWebsite.trim() || null,
        salary: form.salary.trim(),
        expertise: form.expertise.trim(),
        experienceRequirement: form.experienceRequirement.trim(),
        recruitmentCount: Number(form.recruitmentCount.trim()),
        workType: form.workType,
        deadlineAt: form.deadlineAt,
        jobDescription: form.jobDescription.trim(),
        candidateRequirements: form.candidateRequirements.trim(),
        benefits: form.benefits.trim(),
        workLocation: form.workLocation.trim(),
        workTime: form.workTime.trim(),
        applicationMethod: form.applicationMethod.trim() || null
      };
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) {
        const maybeErrors = (data as any)?.errors as Record<string, string> | undefined;
        if (maybeErrors && typeof maybeErrors === "object") {
          setFieldErrors(maybeErrors);
          return;
        }
        setToast(data.message || "Sửa tin thất bại.");
        return;
      }
      setToast(data.message || "Sửa tin tuyển dụng thành công.");
      setEditTarget(null);
      setEditDetail(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Sửa tin thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doStop = async () => {
    if (!stopTarget) return;
    setBusyId(stopTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${stopTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) throw new Error(data.message || "Dừng hoạt động thất bại.");
      setToast(data.message || "Đã dừng hoạt động.");
      setStopTarget(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Dừng hoạt động thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setToast("");
    try {
      const res = await fetch(`/api/doanhnghiep/tuyen-dung/${deleteTarget.id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok) {
        setToast(data.message || "Xóa thất bại.");
        return;
      }
      setToast(data.message || "Xóa tin tuyển dụng thành công.");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const canEdit = (s: JobStatus) => s === "PENDING" || s === "REJECTED";
  const canStop = (s: JobStatus) => s !== "STOPPED";

  const openAdd = async () => {
    setToast("");
    try {
      const res = await fetch("/api/doanhnghiep/tuyen-dung/open-batch");
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Lỗi kiểm tra đợt thực tập.");
      if (!data.hasOpenBatch) {
        setToast("Phòng đào tạo chưa mở đợt thực tập. Vui lòng chờ đến khi mở đợt thực tập");
        return;
      }
      resetFormForAdd();
      setAddOpen(true);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không thể mở form tạo tin.");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tin tuyển dụng</h1>
        <p className={styles.subtitle}>Quản lý tin tuyển dụng thực tập sinh của doanh nghiệp.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}
      {error ? <p className={styles.modulePlaceholder}>{error}</p> : null}

      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField} style={{ minWidth: 280, flex: 1 }}>
          <label>Tên tiêu đề / Chuyên môn</label>
          <input
            className={adminStyles.textInputSearch}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Nhập tiêu đề hoặc chuyên môn"
            style={{ width: "100%" }}
          />
        </div>
        <div className={adminStyles.searchField} style={{ minWidth: 180, flex: 1 }}>
          <label>Ngày đăng tin</label>
          <input
            className={adminStyles.textInputSearch}
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            placeholder="Chọn ngày"
            style={{ width: "100%" }}
          />
        </div>
        <div className={adminStyles.searchField} style={{ minWidth: 180, flex: 1 }}>
          <label>Trạng thái</label>
          <select className={adminStyles.selectInput} value={searchStatus} onChange={(e) => setSearchStatus(e.target.value as any)} style={{ width: "100%" }}>
            <option value="all">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="REJECTED">Từ chối duyệt</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="STOPPED">Dừng hoạt động</option>
          </select>
        </div>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void refresh()} style={{ minWidth: 120 }}>
          Tìm kiếm
        </button>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void openAdd()} style={{ minWidth: 170 }}>
          Thêm tin tuyển dụng
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.dataTable}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tiêu đề</th>
                <th>Ngày đăng tin</th>
                <th>Số lượng tuyển dụng</th>
                <th>Chuyên môn</th>
                <th>Hình thức làm việc</th>
                <th>Trạng thái tin</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.modulePlaceholder}>
                    Không có tin tuyển dụng phù hợp.
                  </td>
                </tr>
              ) : (
                pagedItems.map((row, idx) => {
                  const editingAllowed = canEdit(row.status);
                  const stoppingAllowed = canStop(row.status);
                  return (
                    <tr key={row.id}>
                      <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td data-label="Tiêu đề">{row.title}</td>
                      <td data-label="Ngày đăng tin">{formatDateVi(row.createdAt)}</td>
                      <td data-label="Số lượng tuyển dụng">{row.recruitmentCount}</td>
                      <td data-label="Chuyên môn">{row.expertise}</td>
                      <td data-label="Hình thức làm việc">{workTypeLabel[row.workType]}</td>
                      <td data-label="Trạng thái tin">{statusLabel[row.status]}</td>
                      <td data-label="Thao tác">
                        <button type="button" className={adminStyles.textLinkBtn} onClick={() => void openView(row)}>
                          Xem
                        </button>
                        {editingAllowed ? (
                          <button type="button" className={adminStyles.textLinkBtn} disabled={busyId !== null} onClick={() => void openEdit(row)}>
                            Sửa
                          </button>
                        ) : null}
                        {stoppingAllowed ? (
                          <button
                            type="button"
                            className={adminStyles.textLinkBtn}
                            disabled={busyId !== null}
                            onClick={() => {
                              setStopTarget(row);
                            }}
                          >
                            Dừng hoạt động
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={adminStyles.textLinkBtn}
                          disabled={busyId !== null}
                          onClick={() => {
                            setDeleteTarget(row);
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={items.length}
          onPageChange={setPage}
          buttonClassName={adminStyles.btn}
          activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
        />
      ) : null}

      {/* Popup: Xem chi tiết */}
      {viewJob || viewLoading ? (
        <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-view-title">
          <div className={`${adminStyles.modal} ${adminStyles.modalExtraWide}`}>
            <h2 id="job-view-title">Xem chi tiết tin tuyển dụng</h2>
            {viewLoading ? <p>Đang tải…</p> : null}
            {viewJob ? (
              <div>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailSectionTitle}>Tiêu đề</div>
                  <div style={{ fontWeight: 600 }}>{viewJob.job.title || "—"}</div>
                </div>
                <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 14 }}>
                  <tbody>
                    <tr>
                      <th scope="row">Thông tin doanh nghiệp</th>
                      <td />
                    </tr>
                    <tr>
                      <th scope="row">Tên doanh nghiệp</th>
                      <td>{viewJob.enterprise.companyName || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">MST</th>
                      <td>{viewJob.enterprise.taxCode || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Lĩnh vực</th>
                      <td>{viewJob.enterprise.businessFields || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Địa điểm trụ sở chính</th>
                      <td>{viewJob.enterprise.headquartersAddress || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Giới thiệu về công ty</th>
                      <td>{viewJob.enterprise.intro || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Website</th>
                      <td>
                        {viewJob.enterprise.website ? (
                          <a href={viewJob.enterprise.website} target="_blank" rel="noopener noreferrer">
                            {viewJob.enterprise.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">Mức lương</th>
                      <td>{viewJob.job.salary || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Chuyên môn</th>
                      <td>{viewJob.job.expertise || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Yêu cầu kinh nghiệm</th>
                      <td>{viewJob.job.experienceRequirement || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Số lượng tuyển dụng</th>
                      <td>{viewJob.job.recruitmentCount || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Hình thức làm việc</th>
                      <td>{workTypeLabel[viewJob.job.workType as WorkType] ?? "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Hạn tuyển dụng</th>
                      <td>{formatDateVi(viewJob.job.deadlineAt)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Mô tả công việc</th>
                      <td>{viewJob.job.jobDescription || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Yêu cầu ứng viên</th>
                      <td>{viewJob.job.candidateRequirements || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Quyền lợi</th>
                      <td>{viewJob.job.benefits || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Địa điểm làm việc</th>
                      <td>{viewJob.job.workLocation || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Thời gian làm việc</th>
                      <td>{viewJob.job.workTime || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Cách thức ứng tuyển</th>
                      <td>{viewJob.job.applicationMethod || "—"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Trạng thái hiện tại của tin</th>
                      <td>{statusLabel[viewJob.job.status as JobStatus] ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
            <div className={adminStyles.modalActions}>
              <button
                type="button"
                className={adminStyles.btn}
                onClick={() => {
                  setViewJob(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Cập nhật trạng thái (Dừng hoạt động) */}
      {stopTarget ? (
        <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-stop-title">
          <div className={adminStyles.modalWide + " " + adminStyles.modal}>
            <h2 id="job-stop-title">Cập nhật trạng thái</h2>
            <p>
              Bạn xác nhận chắc chắn dừng hoạt động của tin: <strong>{stopTarget.title}</strong>?
            </p>
            <div className={adminStyles.modalActions}>
              <button type="button" className={adminStyles.btn} onClick={() => setStopTarget(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`${adminStyles.btn} ${adminStyles.btnDanger}`}
                disabled={busyId !== null}
                onClick={() => void doStop()}
              >
                Dừng hoạt động
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Xóa tin */}
      {deleteTarget ? (
        <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-del-title">
          <div className={adminStyles.modalWide + " " + adminStyles.modal}>
            <h2 id="job-del-title">Xóa tin tuyển dụng</h2>
            <p>
              Bạn có chắc chắn muốn xóa tin tuyển dụng: <strong>{deleteTarget.title}</strong> không?
            </p>
            <div className={adminStyles.modalActions}>
              <button type="button" className={adminStyles.btn} onClick={() => setDeleteTarget(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`${adminStyles.btn} ${adminStyles.btnDanger}`}
                disabled={busyId !== null}
                onClick={() => void doDelete()}
              >
                Xóa tin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Thêm tin */}
      {addOpen ? (
        <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-add-title">
          <div className={`${adminStyles.modalWide} ${adminStyles.modal}`}>
            <h2 id="job-add-title">Thêm tin tuyển dụng mới</h2>
            <fieldset disabled={busyId !== null} style={{ border: 0, padding: 0, marginTop: 10 }}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Thông tin doanh nghiệp</label>
                <textarea
                  className={formStyles.input as any}
                  value={form.companyIntro}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyIntro: e.target.value }))}
                  placeholder="Giới thiệu về công ty"
                />
                {fieldErrors.companyIntro ? <p className={formStyles.error}>{fieldErrors.companyIntro}</p> : null}
                <input
                  className={formStyles.input}
                  value={form.companyWebsite}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyWebsite: e.target.value }))}
                  placeholder="Website (nếu có)"
                />
                {fieldErrors.companyWebsite ? <p className={formStyles.error}>{fieldErrors.companyWebsite}</p> : null}
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Tiêu đề <span className={formStyles.required}>*</span>
                </label>
                  <input
                    className={formStyles.input}
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Nhập tiêu đề tin tuyển dụng"
                  />
                {fieldErrors.title ? <p className={formStyles.error}>{fieldErrors.title}</p> : null}
              </div>
              <div className={formStyles.grid2}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Mức lương <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.salary}
                    onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
                    placeholder="Nhập mức lương (VD: 1000-1500)"
                  />
                  {fieldErrors.salary ? <p className={formStyles.error}>{fieldErrors.salary}</p> : null}
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Chuyên môn <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.expertise}
                    onChange={(e) => setForm((p) => ({ ...p, expertise: e.target.value }))}
                    placeholder="Nhập chuyên môn"
                  />
                  {fieldErrors.expertise ? <p className={formStyles.error}>{fieldErrors.expertise}</p> : null}
                </div>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Yêu cầu kinh nghiệm <span className={formStyles.required}>*</span>
                </label>
                  <input
                    className={formStyles.input}
                    value={form.experienceRequirement}
                    onChange={(e) => setForm((p) => ({ ...p, experienceRequirement: e.target.value }))}
                    placeholder="Nhập yêu cầu kinh nghiệm"
                  />
                {fieldErrors.experienceRequirement ? <p className={formStyles.error}>{fieldErrors.experienceRequirement}</p> : null}
              </div>
              <div className={formStyles.grid2}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Số lượng tuyển dụng <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.recruitmentCount}
                    onChange={(e) => setForm((p) => ({ ...p, recruitmentCount: e.target.value }))}
                    placeholder="Nhập số lượng tuyển dụng"
                  />
                  {fieldErrors.recruitmentCount ? <p className={formStyles.error}>{fieldErrors.recruitmentCount}</p> : null}
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Hình thức làm việc <span className={formStyles.required}>*</span>
                  </label>
                  <select className={formStyles.select} value={form.workType} onChange={(e) => setForm((p) => ({ ...p, workType: e.target.value as any }))}>
                    <option value="">Chọn...</option>
                    <option value="PART_TIME">part-time</option>
                    <option value="FULL_TIME">full-time</option>
                  </select>
                  {fieldErrors.workType ? <p className={formStyles.error}>{fieldErrors.workType}</p> : null}
                </div>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Hạn tuyển dụng <span className={formStyles.required}>*</span>
                </label>
                  <input
                    className={formStyles.input}
                    type="date"
                    value={form.deadlineAt}
                    onChange={(e) => setForm((p) => ({ ...p, deadlineAt: e.target.value }))}
                    placeholder="Chọn ngày"
                  />
                {fieldErrors.deadlineAt ? <p className={formStyles.error}>{fieldErrors.deadlineAt}</p> : null}
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Mô tả công việc <span className={formStyles.required}>*</span>
                </label>
                  <textarea
                    className={formStyles.input as any}
                    value={form.jobDescription}
                    onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))}
                    placeholder="Nhập mô tả công việc"
                  />
                {fieldErrors.jobDescription ? <p className={formStyles.error}>{fieldErrors.jobDescription}</p> : null}
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Yêu cầu ứng viên <span className={formStyles.required}>*</span>
                </label>
                  <textarea
                    className={formStyles.input as any}
                    value={form.candidateRequirements}
                    onChange={(e) => setForm((p) => ({ ...p, candidateRequirements: e.target.value }))}
                    placeholder="Nhập yêu cầu ứng viên"
                  />
                {fieldErrors.candidateRequirements ? <p className={formStyles.error}>{fieldErrors.candidateRequirements}</p> : null}
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Quyền lợi <span className={formStyles.required}>*</span>
                </label>
                  <textarea
                    className={formStyles.input as any}
                    value={form.benefits}
                    onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))}
                    placeholder="Nhập quyền lợi"
                  />
                {fieldErrors.benefits ? <p className={formStyles.error}>{fieldErrors.benefits}</p> : null}
              </div>
              <div className={formStyles.grid2}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Địa điểm làm việc <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.workLocation}
                    onChange={(e) => setForm((p) => ({ ...p, workLocation: e.target.value }))}
                    placeholder="Nhập địa điểm làm việc"
                  />
                  {fieldErrors.workLocation ? <p className={formStyles.error}>{fieldErrors.workLocation}</p> : null}
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Thời gian làm việc <span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    value={form.workTime}
                    onChange={(e) => setForm((p) => ({ ...p, workTime: e.target.value }))}
                    placeholder="Nhập thời gian làm việc"
                  />
                  {fieldErrors.workTime ? <p className={formStyles.error}>{fieldErrors.workTime}</p> : null}
                </div>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Cách thức ứng tuyển</label>
                <textarea
                  className={formStyles.input as any}
                  value={form.applicationMethod}
                  onChange={(e) => setForm((p) => ({ ...p, applicationMethod: e.target.value }))}
                  placeholder="Nhập cách thức ứng tuyển"
                />
              </div>
            </fieldset>
            <div className={adminStyles.modalActions}>
              <button type="button" className={adminStyles.btn} onClick={() => setAddOpen(false)}>
                Hủy
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busyId !== null} onClick={() => void submitCreate()}>
                Tạo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Popup: Sửa tin */}
      {editTarget ? (
        <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-edit-title">
          <div className={`${adminStyles.modalWide} ${adminStyles.modal}`}>
            <h2 id="job-edit-title">Sửa tin tuyển dụng</h2>
            {editLoading || !editDetail ? <p>Đang tải…</p> : null}
            {editDetail ? (
              <div>
                {editDetail.job.status === "REJECTED" ? (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                      Lý do từ chối: <strong>{editDetail.job.rejectionReason || "—"}</strong>
                    </p>
                  </div>
                ) : null}

                {/* dùng lại form Add */}
                <fieldset disabled={busyId !== null} style={{ border: 0, padding: 0, marginTop: 8 }}>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Thông tin doanh nghiệp</label>
                    <textarea
                      className={formStyles.input as any}
                      value={form.companyIntro}
                      onChange={(e) => setForm((p) => ({ ...p, companyIntro: e.target.value }))}
                      placeholder="Giới thiệu về công ty (có thể để trống)"
                    />
                    <input
                      className={formStyles.input}
                      value={form.companyWebsite}
                      onChange={(e) => setForm((p) => ({ ...p, companyWebsite: e.target.value }))}
                      placeholder="Website (nếu có)"
                    />
                    {fieldErrors.companyWebsite ? <p className={formStyles.error}>{fieldErrors.companyWebsite}</p> : null}
                  </div>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Tiêu đề <span className={formStyles.required}>*</span>
                    </label>
                    <input
                      className={formStyles.input}
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Nhập tiêu đề tin tuyển dụng"
                    />
                    {fieldErrors.title ? <p className={formStyles.error}>{fieldErrors.title}</p> : null}
                  </div>

                  <div className={formStyles.grid2}>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Mức lương <span className={formStyles.required}>*</span>
                      </label>
                        <input
                          className={formStyles.input}
                          value={form.salary}
                          onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
                          placeholder="Nhập mức lương (VD: 1000-1500)"
                        />
                      {fieldErrors.salary ? <p className={formStyles.error}>{fieldErrors.salary}</p> : null}
                    </div>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Chuyên môn <span className={formStyles.required}>*</span>
                      </label>
                        <input
                          className={formStyles.input}
                          value={form.expertise}
                          onChange={(e) => setForm((p) => ({ ...p, expertise: e.target.value }))}
                          placeholder="Nhập chuyên môn"
                        />
                      {fieldErrors.expertise ? <p className={formStyles.error}>{fieldErrors.expertise}</p> : null}
                    </div>
                  </div>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Yêu cầu kinh nghiệm <span className={formStyles.required}>*</span>
                    </label>
                    <input
                      className={formStyles.input}
                      value={form.experienceRequirement}
                      onChange={(e) => setForm((p) => ({ ...p, experienceRequirement: e.target.value }))}
                      placeholder="Nhập yêu cầu kinh nghiệm"
                    />
                    {fieldErrors.experienceRequirement ? <p className={formStyles.error}>{fieldErrors.experienceRequirement}</p> : null}
                  </div>

                  <div className={formStyles.grid2}>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Số lượng tuyển dụng <span className={formStyles.required}>*</span>
                      </label>
                      <input
                        className={formStyles.input}
                        value={form.recruitmentCount}
                        onChange={(e) => setForm((p) => ({ ...p, recruitmentCount: e.target.value }))}
                        placeholder="Nhập số lượng tuyển dụng"
                      />
                      {fieldErrors.recruitmentCount ? <p className={formStyles.error}>{fieldErrors.recruitmentCount}</p> : null}
                    </div>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Hình thức làm việc <span className={formStyles.required}>*</span>
                      </label>
                      <select className={formStyles.select} value={form.workType} onChange={(e) => setForm((p) => ({ ...p, workType: e.target.value as any }))}>
                        <option value="">Chọn...</option>
                        <option value="PART_TIME">part-time</option>
                        <option value="FULL_TIME">full-time</option>
                      </select>
                      {fieldErrors.workType ? <p className={formStyles.error}>{fieldErrors.workType}</p> : null}
                    </div>
                  </div>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Hạn tuyển dụng <span className={formStyles.required}>*</span>
                    </label>
                    <input
                      className={formStyles.input}
                      type="date"
                      value={form.deadlineAt}
                      onChange={(e) => setForm((p) => ({ ...p, deadlineAt: e.target.value }))}
                      placeholder="Chọn ngày"
                    />
                    {fieldErrors.deadlineAt ? <p className={formStyles.error}>{fieldErrors.deadlineAt}</p> : null}
                  </div>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Mô tả công việc <span className={formStyles.required}>*</span>
                    </label>
                    <textarea
                      className={formStyles.input as any}
                      value={form.jobDescription}
                      onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))}
                      placeholder="Nhập mô tả công việc"
                    />
                    {fieldErrors.jobDescription ? <p className={formStyles.error}>{fieldErrors.jobDescription}</p> : null}
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Yêu cầu ứng viên <span className={formStyles.required}>*</span>
                    </label>
                    <textarea
                      className={formStyles.input as any}
                      value={form.candidateRequirements}
                      onChange={(e) => setForm((p) => ({ ...p, candidateRequirements: e.target.value }))}
                      placeholder="Nhập yêu cầu ứng viên"
                    />
                    {fieldErrors.candidateRequirements ? <p className={formStyles.error}>{fieldErrors.candidateRequirements}</p> : null}
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Quyền lợi <span className={formStyles.required}>*</span>
                    </label>
                    <textarea
                      className={formStyles.input as any}
                      value={form.benefits}
                      onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))}
                      placeholder="Nhập quyền lợi"
                    />
                    {fieldErrors.benefits ? <p className={formStyles.error}>{fieldErrors.benefits}</p> : null}
                  </div>

                  <div className={formStyles.grid2}>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Địa điểm làm việc <span className={formStyles.required}>*</span>
                      </label>
                      <input
                        className={formStyles.input}
                        value={form.workLocation}
                        onChange={(e) => setForm((p) => ({ ...p, workLocation: e.target.value }))}
                        placeholder="Nhập địa điểm làm việc"
                      />
                      {fieldErrors.workLocation ? <p className={formStyles.error}>{fieldErrors.workLocation}</p> : null}
                    </div>
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Thời gian làm việc <span className={formStyles.required}>*</span>
                      </label>
                      <input
                        className={formStyles.input}
                        value={form.workTime}
                        onChange={(e) => setForm((p) => ({ ...p, workTime: e.target.value }))}
                        placeholder="Nhập thời gian làm việc"
                      />
                      {fieldErrors.workTime ? <p className={formStyles.error}>{fieldErrors.workTime}</p> : null}
                    </div>
                  </div>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Cách thức ứng tuyển</label>
                    <textarea
                      className={formStyles.input as any}
                      value={form.applicationMethod}
                      onChange={(e) => setForm((p) => ({ ...p, applicationMethod: e.target.value }))}
                      placeholder="Nhập cách thức ứng tuyển"
                    />
                  </div>
                </fieldset>
              </div>
            ) : null}

            <div className={adminStyles.modalActions}>
              <button
                type="button"
                className={adminStyles.btn}
                onClick={() => {
                  setEditTarget(null);
                  setEditDetail(null);
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
                disabled={busyId !== null}
                onClick={() => void submitEdit()}
              >
                Sửa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
