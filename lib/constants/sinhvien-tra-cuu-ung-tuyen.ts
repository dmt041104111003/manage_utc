import type { InternshipStatus, WorkType } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT = "/api/sinhvien/tra-cuu-ung-tuyen";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT = "Không thể tải danh sách tin tuyển dụng.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE = "Tra cứu và ứng tuyển";
export const SINHVIEN_TRA_CUU_UNG_TUYEN_SUBTITLE =
  "Danh sách tin tuyển dụng đã duyệt và còn hạn cho sinh viên.";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_SEARCH_BUTTON_TEXT = "Tìm kiếm";

export const SINHVIEN_TRA_CUU_UNG_TUYEN_EMPTY_TEXT = "Không có tin tuyển dụng phù hợp.";

export const workTypeLabel: Record<WorkType, string> = { PART_TIME: "Part-time", FULL_TIME: "Full-time" };

export const internshipLabel: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Tự túc",
  REPORT_SUBMITTED: "Đã nộp báo cáo",
  COMPLETED: "Hoàn thành",
  REJECTED: "Từ chối"
};

export function getSinhVienTraCuuUngTuyenStatusNoteText(canApply: boolean, internshipStatus: InternshipStatus): string {
  if (canApply) return "Bạn có thể ứng tuyển.";
  return `Nút ứng tuyển bị khóa vì trạng thái thực tập hiện tại là "${internshipLabel[internshipStatus]}".`;
}

export const canApplyStatusText = "Có thể ứng tuyển";
export const appliedStatusText = "Đã ứng tuyển";

