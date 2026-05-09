import type { JobApplicationResponse, JobApplicationStatus, JobStatus, WorkType } from "@/lib/types/doanhnghiep-ung-vien-detail";

export const DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE = 10;

export const applicationStatusLabel: Record<JobApplicationStatus, string> = {
  PENDING_REVIEW: "Chờ xem xét",
  INTERVIEW_INVITED: "Mời phỏng vấn",
  OFFERED: "Trúng tuyển",
  REJECTED: "Từ chối",
  STUDENT_DECLINED: "Ứng viên từ chối"
};

export const responseLabel: Record<JobApplicationResponse, string> = {
  PENDING: "Chờ phản hồi",
  ACCEPTED: "Đồng ý",
  DECLINED: "Từ chối"
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

