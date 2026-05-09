import type { DashboardNavItem } from "./dashboard-nav";

export const GIANGVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/giangvien/dashboard", label: "Tổng quan", icon: "overview" },
  { href: "/giangvien/tai-khoan", label: "Tài khoản", icon: "account" },
  { href: "/giangvien/sinh-vien", label: "Sinh viên được phân công", icon: "students" },
  { href: "/giangvien/bao-cao", label: "Quản lý BCTT", icon: "report" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu", icon: "password" }
];

export const GIANGVIEN_DASHBOARD_TOPBAR_TITLE = "Giảng viên";
