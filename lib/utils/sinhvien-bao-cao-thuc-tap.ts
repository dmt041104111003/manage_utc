import type { InternshipReportReviewStatus, InternshipStatus, Report } from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import {
  BCTT_ERROR_INVALID_MIME,
  BCTT_ALLOWED_MIMES
} from "@/lib/constants/sinhvien-bao-cao-thuc-tap";

export function isAllowedBcttMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (BCTT_ALLOWED_MIMES as readonly string[]).includes(mime);
}

export function getBcttFileValidationError(mime: string | null | undefined): string | null {
  if (!isAllowedBcttMime(mime)) return BCTT_ERROR_INVALID_MIME;
  return null;
}

export function getSinhVienBaoCaoStatusHintText(args: {
  canShowResults: boolean;
  canSubmitReport: boolean;
  canEditReport: boolean;
  internshipStatus: InternshipStatus;
  report: Report | null;
}): string {
  const { canShowResults, canSubmitReport, canEditReport, internshipStatus, report } = args;

  if (canShowResults) return "Kết quả đã được ghi nhận.";
  if (canSubmitReport) return "Bạn có thể nộp báo cáo thực tập.";
  if (canEditReport && report?.supervisorRejectReason)
    return `GVHD từ chối duyệt BCTT: ${report.supervisorRejectReason}`;
  if (report?.reviewStatus === "REJECTED")
    return "BCTT đã bị GVHD từ chối. Bạn có thể sửa và nộp lại.";
  if (internshipStatus === "REJECTED")
    return "Bạn đã bị từ chối theo quyết định cuối cùng.";
  if (report?.reviewStatus === "APPROVED")
    return "GVHD đã duyệt BCTT. Chờ admin chốt trạng thái thực tập cuối cùng.";
  return "Chờ xử lý từ GVHD.";
}

