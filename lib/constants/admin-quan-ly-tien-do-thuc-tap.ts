import type { Degree, InternshipStatus } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";

export const ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE = 10;

export const ADMIN_TIEN_DO_FILTER_EXPORT_HEADER = [
  "MSV",
  "Họ tên",
  "Lớp",
  "Khoa",
  "Khóa",
  "Bậc",
  "SĐT",
  "Email",
  "Trạng thái tiến độ",
  "GVHD họ tên",
  "GVHD email",
  "GVHD SĐT",
  "Doanh nghiệp",
  "Vị trí tuyển dụng",
  "Trạng thái duyệt BCTT",
  "Điểm GVHD (BCTT)",
  "Điểm DN (BCTT)"
] as const;

export const degreeLabel: Record<Degree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };

export const internshipStatusLabel: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Thực tập tự túc",
  REPORT_SUBMITTED: "Đã nộp BCTT",
  COMPLETED: "Hoàn thành thực tập",
  REJECTED: "Chưa hoàn thành thực tập"
};

export const supervisorDegreeLabel: Record<string, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

