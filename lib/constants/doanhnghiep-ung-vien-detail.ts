import type { JobApplicationResponse, JobApplicationStatus, JobStatus, StudentDegree, WorkType } from "@/lib/types/doanhnghiep-ung-vien-detail";

export const DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE = 10;

export const applicationStatusLabel: Record<JobApplicationStatus, string> = {
  PENDING_REVIEW: "Chờ xem xét",
  INTERVIEW_INVITED: "Mời phỏng vấn",
  OFFERED: "Trúng tuyển",
  REJECTED: "Từ chối",
  STUDENT_DECLINED: "Ứng viên từ chối"
};

export const applicationStatusColor: Record<JobApplicationStatus, { bg: string; color: string }> = {
  PENDING_REVIEW: { bg: "#f3f4f6", color: "#374151" },
  INTERVIEW_INVITED: { bg: "#eff6ff", color: "#1d4ed8" },
  OFFERED: { bg: "#f0fdf4", color: "#16a34a" },
  REJECTED: { bg: "#fef2f2", color: "#dc2626" },
  STUDENT_DECLINED: { bg: "#fff7ed", color: "#c2410c" }
};

export const responseLabel: Record<JobApplicationResponse, string> = {
  PENDING: "Chờ phản hồi",
  ACCEPTED: "Đã chấp nhận",
  DECLINED: "Đã từ chối"
};

export const degreeLabel: Record<StudentDegree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

export const workTypeLabel: Record<WorkType, string> = {
  PART_TIME: "Bán thời gian",
  FULL_TIME: "Toàn thời gian"
};

export const jobStatusLabel: Record<JobStatus, string> = {
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối duyệt",
  ACTIVE: "Đang hoạt động",
  STOPPED: "Dừng hoạt động"
};

