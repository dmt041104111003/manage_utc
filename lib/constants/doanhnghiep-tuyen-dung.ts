import type { JobStatus, WorkType } from "@/lib/types/doanhnghiep-tuyen-dung";
import { DOANHNGHIEP_REGISTER_WEBSITE_PATTERN } from "@/lib/constants/doanhnghiep";

export const DOANHNGHIEP_TUYEN_DUNG_PAGE_SIZE = 10;

export const DOANHNGHIEP_TUYEN_DUNG_STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối duyệt",
  ACTIVE: "Đang hoạt động",
  STOPPED: "Dừng hoạt động"
};

export const DOANHNGHIEP_TUYEN_DUNG_WORK_TYPE_LABEL: Record<WorkType, string> = {
  PART_TIME: "part-time",
  FULL_TIME: "full-time"
};

export const DOANHNGHIEP_TUYEN_DUNG_TITLE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
export const DOANHNGHIEP_TUYEN_DUNG_EXPERTISE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
export const DOANHNGHIEP_TUYEN_DUNG_SALARY_PATTERN = /^[\p{L}\d\s\-]{1,150}$/u;
export const DOANHNGHIEP_TUYEN_DUNG_COUNT_PATTERN = /^\d{1,10}$/;

export const DOANHNGHIEP_TUYEN_DUNG_DEADLINE_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DOANHNGHIEP_TUYEN_DUNG_ERROR_TITLE =
  "Tiêu đề chỉ gồm ký tự chữ và số (1–255).";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_SALARY =
  "Mức lương chỉ gồm chữ, số, '-' (1–150).";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERTISE =
  "Chuyên môn chỉ gồm chữ, số (1–255).";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERIENCE_REQUIREMENT =
  "Yêu cầu kinh nghiệm chỉ gồm chữ, số (1–255).";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_RECRUITMENT_COUNT =
  "Số lượng tuyển dụng chỉ gồm số (1–10).";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TYPE = "Hình thức làm việc không hợp lệ.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT = "Hạn tuyển dụng không hợp lệ.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT_MUST_BE_IN_FUTURE =
  "Hạn tuyển dụng phải lớn hơn ngày hiện tại.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_JOB_DESCRIPTION = "Mô tả công việc bắt buộc.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_CANDIDATE_REQUIREMENTS = "Yêu cầu ứng viên bắt buộc.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_BENEFITS = "Quyền lợi bắt buộc.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_LOCATION =
  "Địa điểm làm việc bắt buộc và tối đa 255 ký tự.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TIME = "Thời gian làm việc bắt buộc.";
export const DOANHNGHIEP_TUYEN_DUNG_ERROR_COMPANY_WEBSITE = "Website không đúng định dạng.";

// Re-export to keep a single source of truth for website validation used in this module
export const DOANHNGHIEP_TUYEN_DUNG_COMPANY_WEBSITE_PATTERN = DOANHNGHIEP_REGISTER_WEBSITE_PATTERN;

