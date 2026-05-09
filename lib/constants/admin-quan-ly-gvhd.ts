import type { Degree, Gender } from "@/lib/types/admin-quan-ly-gvhd";

export const ADMIN_QUAN_LY_GVHD_PAGE_SIZE = 10;

export const ADMIN_QUAN_LY_GVHD_NAME_PATTERN = /^[\p{L}\s]{1,255}$/u;
export const ADMIN_QUAN_LY_GVHD_PHONE_PATTERN = /^\d{8,12}$/;

export const ADMIN_QUAN_LY_GVHD_FACULTY_CUSTOM_VALUE = "__custom__";

export const ADMIN_QUAN_LY_GVHD_GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
};

export const ADMIN_QUAN_LY_GVHD_DEGREE_LABEL: Record<Degree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

export const ADMIN_QUAN_LY_GVHD_DEGREE_OPTIONS: Array<{ value: Degree; label: string }> = [
  { value: "MASTER", label: "Thạc sĩ" },
  { value: "PHD", label: "Tiến sĩ" },
  { value: "ASSOC_PROF", label: "Phó giáo sư" },
  { value: "PROF", label: "Giáo sư" }
];

export const ADMIN_QUAN_LY_GVHD_GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" }
];

