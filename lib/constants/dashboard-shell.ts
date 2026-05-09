import type { DashboardRole } from "@/lib/types/dashboard";
import type { DashboardNavItem } from "./dashboard-nav";
import { ADMIN_DASHBOARD_NAV, ADMIN_DASHBOARD_TOPBAR_TITLE } from "./admin";
import { DOANHNGHIEP_DASHBOARD_NAV, DOANHNGHIEP_DASHBOARD_TOPBAR_TITLE } from "./doanhnghiep";
import { GIANGVIEN_DASHBOARD_NAV, GIANGVIEN_DASHBOARD_TOPBAR_TITLE } from "./giangvien";
import { SINHVIEN_DASHBOARD_NAV, SINHVIEN_DASHBOARD_TOPBAR_TITLE } from "./sinhvien";

export const DASHBOARD_NAV_BY_ROLE: Record<DashboardRole, DashboardNavItem[]> = {
  admin: ADMIN_DASHBOARD_NAV,
  giangvien: GIANGVIEN_DASHBOARD_NAV,
  sinhvien: SINHVIEN_DASHBOARD_NAV,
  doanhnghiep: DOANHNGHIEP_DASHBOARD_NAV
};

export const DASHBOARD_TOPBAR_TITLE_BY_ROLE: Record<DashboardRole, string> = {
  admin: ADMIN_DASHBOARD_TOPBAR_TITLE,
  giangvien: GIANGVIEN_DASHBOARD_TOPBAR_TITLE,
  sinhvien: SINHVIEN_DASHBOARD_TOPBAR_TITLE,
  doanhnghiep: DOANHNGHIEP_DASHBOARD_TOPBAR_TITLE
};
