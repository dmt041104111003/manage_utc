import type { DashboardNavItem } from "./dashboard-nav";

export const GIANGVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/giangvien/dashboard", label: "Tổng quan" },
  { href: "/giangvien/tai-khoan", label: "Tài khoản" },
  { href: "/giangvien/sinh-vien", label: "Quản lý sinh viên được phân công" },
  { href: "/giangvien/bao-cao", label: "Quản lý BCTT" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const GIANGVIEN_DASHBOARD_TOPBAR_TITLE = "Giảng viên";
