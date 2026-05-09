import type { DashboardNavItem } from "./dashboard-nav";

export const GIANGVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/giangvien/dashboard", label: "Tổng quan" },
  { href: "/giangvien/sinh-vien", label: "Sinh viên hướng dẫn" },
  { href: "/giangvien/bao-cao", label: "Báo cáo thực tập" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const GIANGVIEN_DASHBOARD_TOPBAR_TITLE = "Giảng viên";
