"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./table-icon-button.module.css";

function isAppInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

type Variant = "default" | "danger" | "success" | "muted";

type Props = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: Variant;
};

export default function TableIconButton({ label, href, onClick, disabled, children, variant = "default" }: Props) {
  const className = `${styles.iconBtn} ${variant !== "default" ? styles[variant] : ""}`;

  if (href) {
    if (isAppInternalHref(href)) {
      return (
        <Link href={href} className={className} title={label} aria-label={label}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={className} title={label} aria-label={label}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={className} title={label} aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
