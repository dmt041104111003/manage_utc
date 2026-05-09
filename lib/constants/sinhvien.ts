import type { DashboardNavItem } from "./dashboard-nav";

export const SINHVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/sinhvien/dashboard", label: "Tổng quan" },
  { href: "/sinhvien/ho-so", label: "Tài khoản" },
  { href: "/sinhvien/tra-cuu-ung-tuyen", label: "Tra cứu và ứng tuyển" },
  { href: "/sinhvien/quan-ly-dang-ky-ung-tuyen", label: "Quản lý đăng ký ứng tuyển" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const SINHVIEN_DASHBOARD_TOPBAR_TITLE = "Sinh viên";
