import type { Degree, GuidanceStatus, InternshipStatus } from "@/lib/types/giangvien-sinh-vien";

export const GIANGVIEN_SINH_VIEN_ENDPOINT = "/api/giangvien/sinh-vien-phan-cong";
export const GIANGVIEN_SINH_VIEN_LOAD_ERROR_DEFAULT =
  "Không thể tải danh sách sinh viên được phân công.";

export const GIANGVIEN_SINH_VIEN_EMPTY_TEXT =
  "Không có sinh viên nào phù hợp với điều kiện.";

export const degreeLabel: Record<Degree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };

export const internshipStatusLabel: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Thực tập tự túc",
  REPORT_SUBMITTED: "Đã nộp BCTT",
  COMPLETED: "Hoàn thành thực tập",
  REJECTED: "Từ chối duyệt BCTT"
};

export const guidanceStatusLabel: Record<GuidanceStatus, string> = {
  GUIDING: "Đang hướng dẫn",
  COMPLETED: "Hoàn thành hướng dẫn"
};

