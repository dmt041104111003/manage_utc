"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { DASHBOARD_NAV_BY_ROLE, DASHBOARD_TOPBAR_TITLE_BY_ROLE } from "@/lib/constants/dashboard-shell";
import type { DashboardRole } from "@/lib/types/dashboard";
import { isDashboardNavActive } from "@/lib/utils/navigation";
import { useAdminPendingEnterpriseCount } from "@/hooks/useAdminPendingEnterpriseCount";
import { useDashboardSidebar } from "@/hooks/useDashboardSidebar";
import styles from "./dashboard-shell.module.css";

const ADMIN_QUAN_LY_DOANH_NGHIEP_HREF = "/admin/quan-ly-doanh-nghiep";
const ROLE_LABEL: Record<DashboardRole, string> = {
  admin: "Admin",
  giangvien: "Giảng viên",
  sinhvien: "Sinh viên",
  doanhnghiep: "Doanh nghiệp"
};

export type { DashboardRole };

type DashboardShellProps = {
  role: DashboardRole;
  children: ReactNode;
};

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { menuOpen, closeMenu, toggleMenu, logoutBusy, handleLogout } = useDashboardSidebar();
  const { count: pendingEnterpriseCount } = useAdminPendingEnterpriseCount(role === "admin");

  useEffect(() => {
    try {
      localStorage.removeItem("manage_utc:query_cache_v1");
      localStorage.removeItem("manage_utc:fetch_cache_v1");
    } catch {
      // ignore
    }
  }, []);

  const navItems = DASHBOARD_NAV_BY_ROLE[role];

  return (
    <div className={styles.layout}>
      <aside
        id="dashboard-sidebar"
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
        aria-label="Menu điều hướng"
      >
        <div className={styles.brand}>
          <p className={styles.brandTitle}>Hệ thống quản lý thực tập</p>
          <p className={styles.brandSub}>Trường Đại học Giao thông Vận tải</p>
          <p className={styles.brandRole}>Trang: {ROLE_LABEL[role]}</p>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = isDashboardNavActive(pathname, item.href);
            const pending =
              role === "admin" && item.href === ADMIN_QUAN_LY_DOANH_NGHIEP_HREF
                ? pendingEnterpriseCount
                : undefined;
            const showPendingBadge = typeof pending === "number";
            const displayCount = showPendingBadge ? (pending > 99 ? "99+" : String(pending)) : "";
            const badgeText = showPendingBadge ? `(${displayCount})` : "";
            const badgeLabel = showPendingBadge ? `${pending} doanh nghiệp chờ phê duyệt` : undefined;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                onClick={closeMenu}
              >
                <span className={styles.navLinkRow}>
                  <span className={styles.navLinkText}>{item.label}</span>
                  {showPendingBadge ? (
                    <span
                      className={`${styles.navBadge} ${pending === 0 ? styles.navBadgeZero : ""}`}
                      title={badgeLabel}
                      aria-label={badgeLabel}
                    >
                      {badgeText}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.footer}>
          <Link
            href="/auth/dangnhap"
            className={styles.logout}
            aria-busy={logoutBusy}
            aria-disabled={logoutBusy}
            onClick={(e) => {
              closeMenu();
              void handleLogout(e);
            }}
          >
            {logoutBusy ? "Đang đăng xuất…" : "Đăng xuất"}
          </Link>
        </div>
      </aside>

      <button
        type="button"
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ""}`}
        aria-label="Đóng menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="dashboard-sidebar"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className={styles.topbarTitle}>{DASHBOARD_TOPBAR_TITLE_BY_ROLE[role]}</h1>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
