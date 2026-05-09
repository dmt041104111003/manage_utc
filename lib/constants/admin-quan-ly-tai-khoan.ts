import type { AccountRow, AccountStatus, Role } from "@/lib/types/admin-quan-ly-tai-khoan";

export const ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE = 10;

export const roleLabel: Record<Role, string> = {
  sinhvien: "SV",
  doanhnghiep: "DN",
  giangvien: "GVHD"
};

export const statusLabel: Record<AccountStatus, string> = {
  ACTIVE: "Đang hoạt động",
  STOPPED: "Dừng hoạt động"
};

export type StudentDegree = "BACHELOR" | "ENGINEER";
export type SupervisorDegree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export const studentDegreeLabel: Record<StudentDegree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

export const supervisorDegreeLabel: Record<SupervisorDegree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

export const genderLabel: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
};

// If you want to type viewTarget later, this is a useful anchor.
export type AccountRowForStatusConfirm = Pick<AccountRow, "id" | "role" | "fullName" | "email" | "status">;

