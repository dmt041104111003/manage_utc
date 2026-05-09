import type { InternshipStatus } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";

/** Khớp nhãn trong GET list/detail tiến độ (không dùng internshipStatusLabel static cho REPORT_SUBMITTED). */
export function getAdminTienDoStatusLabel(status: InternshipStatus, reportReviewStatus: string | null): string {
  if (status === "REPORT_SUBMITTED") {
    if (reportReviewStatus === "APPROVED") return "Đã duyệt BCTT";
    if (reportReviewStatus === "REJECTED") return "BCTT bị giảng viên hướng dẫn từ chối";
    return "Chờ giảng viên hướng dẫn duyệt";
  }
  if (status === "REJECTED") return "Từ chối";
  if (status === "COMPLETED") return "Hoàn thành thực tập";
  if (status === "DOING") return "Đang thực tập";
  if (status === "SELF_FINANCED") return "Thực tập tự túc";
  return "Chưa thực tập";
}
