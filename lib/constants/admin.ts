import type { DashboardNavItem } from "./dashboard-nav";

export const ADMIN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/quan-ly-doanh-nghiep", label: "Quản lý doanh nghiệp" },
  { href: "/admin/bao-cao", label: "Báo cáo – thống kê" }
];

export const ADMIN_DASHBOARD_TOPBAR_TITLE = "Quản trị hệ thống";
