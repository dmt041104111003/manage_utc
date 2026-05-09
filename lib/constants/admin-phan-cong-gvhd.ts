import type { AssignmentStatus, StudentDegree, SupervisorDegree } from "@/lib/types/admin-phan-cong-gvhd";

export const ADMIN_PHAN_CONG_GVHD_PAGE_SIZE = 10;
export const ADMIN_PHAN_CONG_GVHD_TABLE_STUDENTS_MAX_LINES = 2;

export const ADMIN_PHAN_CONG_GVHD_STATUS_LABEL: Record<AssignmentStatus, string> = {
  GUIDING: "Đang hướng dẫn",
  COMPLETED: "Hoàn thành hướng dẫn"
};

export const ADMIN_PHAN_CONG_GVHD_STUDENT_DEGREE_LABEL: Record<StudentDegree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

export const ADMIN_PHAN_CONG_GVHD_SUPERVISOR_DEGREE_LABEL: Record<SupervisorDegree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

