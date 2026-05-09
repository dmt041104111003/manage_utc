import type { DashboardNavItem } from "./dashboard-nav";

export const ADMIN_DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: "overview" },
  { href: "/admin/quan-ly-doanh-nghiep", label: "Quản lý doanh nghiệp", icon: "building" },
  { href: "/admin/quan-ly-dot-thuc-tap", label: "Quản lý đợt thực tập", icon: "calendar" },
  { href: "/admin/quan-ly-tai-khoan", label: "Quản lý tài khoản", icon: "accounts" },
  { href: "/admin/phan-cong-gvhd", label: "Phân công GVHD", icon: "assign" },
  { href: "/admin/quan-ly-sinh-vien", label: "Quản lý sinh viên", icon: "students" },
  { href: "/admin/quan-ly-gvhd", label: "Quản lý GVHD", icon: "instructors" },
  { href: "/admin/quan-ly-tin-tuyen-dung", label: "Quản lý tin tuyển dụng", icon: "documents" },
  { href: "/admin/quan-ly-tien-do-thuc-tap", label: "Quản lý tiến độ thực tập", icon: "progress" }
];

export const ADMIN_DASHBOARD_TOPBAR_TITLE = "Quản trị hệ thống";
