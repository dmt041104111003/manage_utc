"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { DASHBOARD_NAV_BY_ROLE, DASHBOARD_TOPBAR_TITLE_BY_ROLE } from "@/lib/constants/dashboard-shell";
import type { DashboardRole } from "@/lib/types/dashboard";
import { isDashboardNavActive } from "@/lib/utils/navigation";
import { useAdminPendingEnterpriseCount } from "@/hooks/useAdminPendingEnterpriseCount";
import { useDashboardSidebar } from "@/hooks/useDashboardSidebar";
import {
  clearAllClientCaches,
  restoreFetchResponseCache,
  schedulePersistFetchResponseCache,
  type FetchResponseCacheEntry
} from "@/lib/utils/client-query-cache";
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
  const reloadingRef = useRef(false);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const globalAny = window as typeof window & {
      __manageUtcFetchCache?: Map<string, FetchResponseCacheEntry>;
    };
    const fetchCache =
      globalAny.__manageUtcFetchCache ?? (globalAny.__manageUtcFetchCache = new Map<string, FetchResponseCacheEntry>());
    restoreFetchResponseCache(fetchCache);
    const patchedFetch: typeof window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isGet = method === "GET";
      const bypass = Boolean(init?.cache === "no-store" || init?.cache === "reload" || init?.headers instanceof Headers && init.headers.get("x-no-cache") === "1");
      const cacheKey = `${method}:${url}`;
      if (isGet && !bypass && fetchCache.has(cacheKey)) {
        const hit = fetchCache.get(cacheKey)!;
        return new Response(hit.bodyText, {
          status: hit.status,
          statusText: hit.statusText,
          headers: hit.headers
        });
      }
      const res = await originalFetch(input, init);
      const isMutation = method !== "GET" && method !== "HEAD";
      if (isGet && res.ok && !bypass) {
        const contentType = String(res.headers.get("content-type") || "").toLowerCase();
        if (contentType.includes("application/json")) {
          try {
            const bodyText = await res.clone().text();
            const headers: Record<string, string> = {};
            res.headers.forEach((v, k) => {
              headers[k] = v;
            });
            fetchCache.set(cacheKey, {
              bodyText,
              status: res.status,
              statusText: res.statusText,
              headers
            });
            schedulePersistFetchResponseCache(fetchCache);
          } catch {
            // ignore cache failure
          }
        }
      }
      if (!isMutation || !res.ok || reloadingRef.current) return res;
      reloadingRef.current = true;
      clearAllClientCaches();
      setTimeout(() => {
        window.location.reload();
      }, 0);
      return res;
    };
    window.fetch = patchedFetch;
    return () => {
      window.fetch = originalFetch;
    };
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
