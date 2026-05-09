import type { AppStatus, RespondAction, StatusFilter } from "@/lib/types/sinhvien-quan-ly-dang-ky-ung-tuyen";
import type { SinhVienQuanLyDangKyUngTuyenRow } from "@/lib/types/sinhvien-quan-ly-dang-ky-ung-tuyen";
import {
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_ENDPOINT,
  sinhvienQuanLyDangKyUngTuyenResponseLabel
} from "@/lib/constants/sinhvien-quan-ly-dang-ky-ung-tuyen";

const APP_STATUS_VALUES: AppStatus[] = [
  "PENDING_REVIEW",
  "INTERVIEW_INVITED",
  "OFFERED",
  "REJECTED",
  "STUDENT_DECLINED"
];

export function isAppStatus(value: string): value is AppStatus {
  return APP_STATUS_VALUES.includes(value as AppStatus);
}

export function parseStatusFilterValue(value: string): StatusFilter {
  if (value === "all") return "all";
  if (isAppStatus(value)) return value;
  return "all";
}

export function buildSinhVienQuanLyDangKyUngTuyenListUrl(statusFilter: StatusFilter): string {
  const sp = new URLSearchParams();
  if (statusFilter !== "all") sp.set("status", statusFilter);
  const qs = sp.toString();
  return qs ? `${SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_ENDPOINT}?${qs}` : SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_ENDPOINT;
}

export function buildSinhVienQuanLyDangKyUngTuyenRespondEndpoint(applicationId: string): string {
  return `${SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_ENDPOINT}/${applicationId}`;
}

export function formatDateVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function getSinhVienQuanLyDangKyUngTuyenResponseText(row: Pick<SinhVienQuanLyDangKyUngTuyenRow, "response">): string {
  return sinhvienQuanLyDangKyUngTuyenResponseLabel[row.response];
}

export function getRespondPayload(action: RespondAction): { action: RespondAction } {
  return { action };
}

