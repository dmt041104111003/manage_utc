"use client";

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import summaryStyles from "./dashboard-stat-summary-card.module.css";

export type DashboardStatSummaryCardProps = {
  cardClassName: string;
  labelClassName: string;
  valueClassName: string;
  label: ReactNode;
  value: ReactNode;
  Icon: IconType;
};

export function DashboardStatSummaryCard({
  cardClassName,
  labelClassName,
  valueClassName,
  label,
  value,
  Icon
}: DashboardStatSummaryCardProps) {
  return (
    <div className={cardClassName}>
      <div className={summaryStyles.head}>
        <span className={summaryStyles.iconCell} aria-hidden>
          <Icon className={summaryStyles.icon} size={28} />
        </span>
        <div className={summaryStyles.body}>
          <p className={labelClassName}>{label}</p>
          <p className={valueClassName}>{value}</p>
        </div>
      </div>
    </div>
  );
}
