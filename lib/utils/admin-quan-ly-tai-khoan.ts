import type { Role } from "@/lib/types/admin-quan-ly-tai-khoan";

export function getAccountViewTitle(role: Role): string {
  return role === "sinhvien"
    ? "Xem thông tin tài khoản sinh viên"
    : role === "giangvien"
      ? "Xem thông tin tài khoản GVHD"
      : "Xem thông tin doanh nghiệp";
}

