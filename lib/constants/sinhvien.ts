import type { DashboardNavItem } from "./dashboard-nav";

export const SINHVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/sinhvien/dashboard", label: "Tổng quan", icon: "overview" },
  { href: "/sinhvien/tai-khoan", label: "Tài khoản cá nhân", icon: "account" },
  { href: "/sinhvien/ho-so", label: "Hồ sơ cá nhân", icon: "profile" },
  { href: "/sinhvien/tra-cuu-ung-tuyen", label: "Tra cứu và ứng tuyển", icon: "search" },
  { href: "/sinhvien/quan-ly-dang-ky-ung-tuyen", label: "Việc làm đã ứng tuyển", icon: "applications" },
  { href: "/sinhvien/bao-cao-thuc-tap", label: "Tiến độ thực tập", icon: "progress" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu", icon: "password" }
];

export const SINHVIEN_DASHBOARD_TOPBAR_TITLE = "Sinh viên";
