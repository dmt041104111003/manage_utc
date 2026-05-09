"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DASHBOARD_NAV_BY_ROLE, DASHBOARD_TOPBAR_TITLE_BY_ROLE } from "@/lib/constants/dashboard-shell";
import type { DashboardRole } from "@/lib/types/dashboard";
import { isDashboardNavActive } from "@/lib/utils/navigation";
import { useDashboardSidebar } from "@/hooks/useDashboardSidebar";
import styles from "./dashboard-shell.module.css";

export type { DashboardRole };

type DashboardShellProps = {
  role: DashboardRole;
  children: ReactNode;
};

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { menuOpen, closeMenu, toggleMenu, logoutBusy, handleLogout } = useDashboardSidebar();

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
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = isDashboardNavActive(pathname, item.href);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                onClick={closeMenu}
              >
                {item.label}
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
