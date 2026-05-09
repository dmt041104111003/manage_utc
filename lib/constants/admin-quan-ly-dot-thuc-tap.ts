import type { InternshipBatchStatus, Semester } from "@/lib/types/admin-quan-ly-dot-thuc-tap";

export const ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE = 10;

export const ADMIN_QUAN_LY_DOT_THUC_TAP_STATUS_LABEL: Record<InternshipBatchStatus, string> = {
  OPEN: "Đang mở",
  CLOSED: "Đóng"
};

export const ADMIN_QUAN_LY_DOT_THUC_TAP_SEMESTER_OPTIONS: Array<{ value: Semester; label: string }> = [
  { value: "HK_I", label: "HK I" },
  { value: "HK_II", label: "HK II" },
  { value: "HK_HE", label: "HK hè" },
  { value: "HK_PHU", label: "HK phụ" }
];

