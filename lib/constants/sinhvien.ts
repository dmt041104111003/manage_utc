import type { DashboardNavItem } from "./dashboard-nav";

export const SINHVIEN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/sinhvien/dashboard", label: "Tổng quan" },
  { href: "/sinhvien/tai-khoan", label: "Tài khoản cá nhân" },
  { href: "/sinhvien/ho-so", label: "Hồ sơ cá nhân" },
  { href: "/sinhvien/tra-cuu-ung-tuyen", label: "Quản lý tra cứu và ứng tuyển" },
  { href: "/sinhvien/quan-ly-dang-ky-ung-tuyen", label: "Quản lý đăng ký ứng tuyển" },
  { href: "/sinhvien/bao-cao-thuc-tap", label: "Quản lý tiến độ thực tập" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const SINHVIEN_DASHBOARD_TOPBAR_TITLE = "Sinh viên";
