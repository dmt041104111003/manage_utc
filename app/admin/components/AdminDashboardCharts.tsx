"use client";

import { useMemo } from "react";
import styles from "../styles/dashboard.module.css";
import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { PROGRESS_STATUS_COLORS } from "@/lib/constants/admin-dashboard-charts";
import { ReactEchart } from "@/app/components/charts/ReactEchart";
import {
  buildDonutChartOption,
  buildGroupedBarChartOption,
  buildLineMultiSeriesOption,
  buildPerBarColorChartOption,
  buildSingleBarChartOption
} from "@/lib/utils/echarts-dashboard-options";

export type GroupedBarSeries = { name: string; data: number[]; colorTop: string; colorBottom: string };

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const option = useMemo(() => buildDonutChartOption(segments), [segments]);
  if (segments.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={280} clickReloadPulse />;
}

export function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const option = useMemo(
    () => buildSingleBarChartOption(labels, values, { valueLabel: "Số lượng" }),
    [labels, values]
  );
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={248} clickReloadPulse />;
}

export function ProgressColumnChart({
  labels,
  values,
  valueAxisName = "Sinh viên",
  colors = PROGRESS_STATUS_COLORS
}: {
  labels: string[];
  values: number[];
  valueAxisName?: string;
  colors?: string[];
}) {
  const option = useMemo(
    () => buildPerBarColorChartOption(labels, values, colors, valueAxisName),
    [labels, values, valueAxisName, colors]
  );
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={248} clickReloadPulse />;
}

export function LineChart({ labels, series }: { labels: string[]; series: SimpleChartSeries[] }) {
  const option = useMemo(() => buildLineMultiSeriesOption(labels, series), [labels, series]);
  if (series.length === 0 || labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={292} clickReloadPulse />;
}

export function GroupedBarChart({ labels, groups }: { labels: string[]; groups: GroupedBarSeries[] }) {
  const option = useMemo(() => buildGroupedBarChartOption(labels, groups), [labels, groups]);
  if (labels.length === 0 || groups.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <ReactEchart option={option} height={280} clickReloadPulse />;
}

export function TopFacultiesCard({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; applications: number; offered: number }>;
}) {
  return (
    <article className={styles.card}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {items.length === 0 ? (
        <div className={styles.modulePlaceholder}>Chưa có dữ liệu.</div>
      ) : (
        <table className={styles.dataTable} style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Khoa/Ngành</th>
              <th>Ứng tuyển</th>
              <th>Trúng tuyển</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.label}>
                <td>{it.label}</td>
                <td>{it.applications}</td>
                <td>{it.offered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
