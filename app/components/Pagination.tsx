"use client";

import type { ReactNode } from "react";

export default function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  buttonClassName,
  activeButtonClassName,
  wrapClassName,
  renderSummary
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
  buttonClassName?: string;
  activeButtonClassName?: string;
  wrapClassName?: string;
  renderSummary?: (args: { page: number; pageSize: number; totalItems: number; totalPages: number }) => ReactNode;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  if (totalItems <= pageSize) return null;

  const canPrev = current > 1;
  const canNext = current < totalPages;

  const setPage = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const pages: number[] = [];
  const add = (p: number) => {
    if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p);
  };

  add(1);
  add(current - 1);
  add(current);
  add(current + 1);
  add(totalPages);

  pages.sort((a, b) => a - b);

  const btnCls = buttonClassName || "";
  const activeCls = activeButtonClassName || btnCls;

  return (
    <nav
      className={wrapClassName}
      aria-label="Phân trang"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}
    >
      <div style={{ fontSize: 13, color: "#6b7280" }}>
        {renderSummary ? renderSummary({ page: current, pageSize, totalItems, totalPages }) : `Trang ${current}/${totalPages} • ${totalItems} bản ghi`}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className={btnCls} onClick={() => setPage(current - 1)} disabled={!canPrev}>
          Trước
        </button>

        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const gap = prev != null && p - prev > 1;
          const isActive = p === current;
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {gap ? <span style={{ color: "#9ca3af" }}>…</span> : null}
              <button
                type="button"
                className={isActive ? activeCls : btnCls}
                onClick={() => setPage(p)}
                disabled={isActive}
                aria-current={isActive ? "page" : undefined}
                style={
                  isActive && !activeButtonClassName
                    ? { fontWeight: 700, borderColor: "#93c5fd", background: "#eff6ff", color: "#1e40af" }
                    : undefined
                }
              >
                {p}
              </button>
            </span>
          );
        })}

        <button type="button" className={btnCls} onClick={() => setPage(current + 1)} disabled={!canNext}>
          Sau
        </button>
      </div>
    </nav>
  );
}

