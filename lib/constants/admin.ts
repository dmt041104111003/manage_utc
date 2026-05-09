import type { DashboardNavItem } from "./dashboard-nav";

export const ADMIN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/quan-ly-doanh-nghiep", label: "Quản lý doanh nghiệp" },
  { href: "/admin/quan-ly-dot-thuc-tap", label: "Quản lý đợt thực tập" },
  { href: "/admin/quan-ly-tai-khoan", label: "Quản lý tài khoản" },
  { href: "/admin/phan-cong-gvhd", label: "Phân công GVHD" },
  { href: "/admin/quan-ly-sinh-vien", label: "Quản lý sinh viên" },
  { href: "/admin/quan-ly-gvhd", label: "Quản lý GVHD" },
  { href: "/admin/quan-ly-tin-tuyen-dung", label: "Quản lý tin tuyển dụng" }
];

export const ADMIN_DASHBOARD_TOPBAR_TITLE = "Quản trị hệ thống";
