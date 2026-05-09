import type { Degree, Gender, InternshipStatus } from "@/lib/types/admin-quan-ly-sinh-vien";

export const ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE = 10;

export const ADMIN_QUAN_LY_SINH_VIEN_FACULTY_CUSTOM_VALUE = "__custom__";

export const ADMIN_QUAN_LY_SINH_VIEN_MSV_PATTERN = /^\d{8,15}$/;
export const ADMIN_QUAN_LY_SINH_VIEN_NAME_PATTERN = /^[\p{L}\s]{1,255}$/u;
export const ADMIN_QUAN_LY_SINH_VIEN_PHONE_PATTERN = /^\d{8,12}$/;
export const ADMIN_QUAN_LY_SINH_VIEN_CLASS_PATTERN = /^[\p{L}\d]{1,255}$/u;
export const ADMIN_QUAN_LY_SINH_VIEN_KHOL_PATTERN = /^[\p{L}\d]{1,10}$/u;

export const ADMIN_QUAN_LY_SINH_VIEN_DEGREE_LABEL: Record<Degree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

export const ADMIN_QUAN_LY_SINH_VIEN_GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
};

export const ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_LABEL: Record<InternshipStatus, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Thực tập tự túc",
  REPORT_SUBMITTED: "Đã nộp báo cáo thực tập",
  COMPLETED: "Hoàn thành thực tập",
  REJECTED: "Từ chối"
};

export const ADMIN_QUAN_LY_SINH_VIEN_SEMESTER_GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" }
];

export const ADMIN_QUAN_LY_SINH_VIEN_DEGREE_OPTIONS: Array<{ value: Degree; label: string }> = [
  { value: "BACHELOR", label: "Cử nhân" },
  { value: "ENGINEER", label: "Kỹ sư" }
];

export const ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_OPTIONS: InternshipStatus[] = [
  "NOT_STARTED",
  "DOING",
  "SELF_FINANCED",
  "REPORT_SUBMITTED",
  "COMPLETED",
  "REJECTED"
];

