"use client";

import { useCallback, useState, type MouseEvent } from "react";

const LOGIN_PATH = "/auth/dangnhap";

export function useDashboardSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const handleLogout = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (logoutBusy) return;
      setLogoutBusy(true);
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        /* vẫn chuyển trang để user thoát UI; cookie có thể còn nếu lỗi mạng */
      }
      window.location.replace(LOGIN_PATH);
    },
    [logoutBusy]
  );

  return { menuOpen, closeMenu, toggleMenu, logoutBusy, handleLogout };
}
