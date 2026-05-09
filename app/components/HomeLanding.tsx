"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../home.module.css";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "#gioi-thieu", label: "Giới thiệu" },
  { href: "#huong-dan", label: "Hướng dẫn" },
  { href: "/auth/dangky", label: "Đăng ký doanh nghiệp" },
  { href: "#lien-he", label: "Liên hệ" }
];

export function HomeLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="" width={44} height={44} className={styles.brandLogo} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>Trường Đại học GTVT</span>
              <span className={styles.brandTag}>Hệ thống quản lý thực tập</span>
            </div>
          </Link>

          <nav className={styles.navDesktop} aria-label="Menu chính">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                replace={item.href.startsWith("/auth")}
                className={styles.navLink}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <button type="button" className={styles.iconButton} aria-label="Tìm kiếm">
              <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4.2-4.2" />
              </svg>
            </button>
            <Link href="/auth/dangnhap" replace className={styles.loginLink}>
              Đăng nhập
            </Link>
            <button
              type="button"
              className={styles.hamburger}
              aria-expanded={menuOpen}
              aria-controls="home-mobile-nav"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div
          id="home-mobile-nav"
          className={`${styles.navMobile} ${menuOpen ? styles.navMobileOpen : ""}`}
          aria-hidden={!menuOpen}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              replace={item.href.startsWith("/auth")}
              className={styles.navMobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/auth/dangnhap" replace className={styles.navMobileLink} onClick={() => setMenuOpen(false)}>
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroInner}>
          <div className={styles.heroLeft} id="gioi-thieu">
            <p className={styles.kicker}>Kết nối nhà trường – doanh nghiệp</p>
            <h1 className={styles.headline}>Quản lý thực tập minh bạch, hiệu quả</h1>
            <p className={styles.lead}>
              Nền tảng hỗ trợ kết nối sinh viên, giảng viên và đơn vị doanh nghiệp theo quy trình thống nhất, phù hợp mô
              hình quản lý giáo dục.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/auth/dangnhap" replace className={styles.ctaOutline}>
                Vào hệ thống
              </Link>
              <Link href="/auth/dangky" replace className={styles.ctaGhost}>
                Đăng ký doanh nghiệp
              </Link>
            </div>
          </div>
    
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Trường Đại học Giao thông Vận tải. Bản quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
