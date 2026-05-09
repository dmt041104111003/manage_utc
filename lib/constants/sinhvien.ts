import type { DashboardNavItem } from "./dashboard-nav";

export const SINHVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/sinhvien/dashboard", label: "Tổng quan" },
  { href: "/sinhvien/ho-so", label: "Hồ sơ thực tập" },
  { href: "/sinhvien/nhat-ky", label: "Nhật ký & báo cáo" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const SINHVIEN_DASHBOARD_TOPBAR_TITLE = "Sinh viên";
