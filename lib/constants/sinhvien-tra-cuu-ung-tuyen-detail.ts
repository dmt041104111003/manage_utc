import type { WorkType } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen-detail";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_DETAIL_ENDPOINT = "/api/sinhvien/tra-cuu-ung-tuyen";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_PROFILE_ENDPOINT = "/api/sinhvien/ho-so-sinh-vien";

export const PHONE_PATTERN = /^\d{8,12}$/;
export const CV_ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

export const workTypeLabel: Record<WorkType, string> = {
  PART_TIME: "Part-time",
  FULL_TIME: "Full-time"
};

export const SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_INVALID = "File CV chỉ chấp nhận định dạng PDF, DOC, DOCX.";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_REQUIRED = "Vui lòng đính kèm file CV.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_PHONE = "Số điện thoại chỉ gồm số (8–12 ký tự).";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_EMAIL = "Email không đúng định dạng.";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_INTRO = "Thư giới thiệu bản thân bắt buộc.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_DETAIL_ERROR_DEFAULT = "Không thể tải chi tiết tin tuyển dụng.";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_PROFILE_ERROR_DEFAULT = "Không thể tải hồ sơ sinh viên.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_OPEN_APPLY_ERROR_DEFAULT = "Không thể mở popup ứng tuyển.";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_SUCCESS_DEFAULT = "Nộp hồ sơ ứng tuyển thành công.";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_ERROR_DEFAULT = "Nộp hồ sơ ứng tuyển thất bại.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE = "Chi tiết tin tuyển dụng";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_BACK_LINK_TEXT = "← Quay lại danh sách";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_APPLY_OPEN_TITLE = "Cập nhật hồ sơ sinh viên";

export const APPLY_BUTTON_LABEL_APPLIED = "Đã ứng tuyển";
export const APPLY_BUTTON_LABEL_DEFAULT = "Ứng tuyển ngay";

