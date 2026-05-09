import type { DashboardNavItem } from "./dashboard-nav";

export const ADMIN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/phe-duyet", label: "Phê duyệt doanh nghiệp" },
  { href: "/admin/bao-cao", label: "Báo cáo – thống kê" },
  { href: "/auth/doimatkhau", label: "Đổi mật khẩu" }
];

export const ADMIN_DASHBOARD_TOPBAR_TITLE = "Quản trị hệ thống";
