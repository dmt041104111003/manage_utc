"use client";

import { useMemo } from "react";
import styles from "../styles/dashboard.module.css";
import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { PROGRESS_STATUS_COLORS } from "@/lib/constants/admin-dashboard-charts";
import { DashboardInteractiveChart } from "@/app/components/charts/DashboardInteractiveChart";
import {
  buildDonutChartOption,
  buildLineMultiSeriesOption,
  buildPerBarColorChartOption,
  buildSingleBarChartOption
} from "@/lib/utils/echarts-dashboard-options";
import {
  buildCategoryBarInsightGetter,
  buildDonutInsightGetter,
  buildLineAxisInsightGetter
} from "@/lib/utils/chart-insights";

export function DonutChart({
  segments,
  total,
  chartTitle = "Biểu đồ vòng"
}: {
  segments: DonutSegment[];
  total: number;
  chartTitle?: string;
}) {
  const option = useMemo(() => buildDonutChartOption(segments), [segments]);
  const getInsights = useMemo(() => buildDonutInsightGetter(segments, total), [segments, total]);
  if (segments.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <DashboardInteractiveChart option={option} height={280} chartTitle={chartTitle} getInsights={getInsights} />;
}

export function BarChart({
  labels,
  values,
  chartTitle = "Cột giá trị"
}: {
  labels: string[];
  values: number[];
  chartTitle?: string;
}) {
  const option = useMemo(
    () => buildSingleBarChartOption(labels, values, { valueLabel: "Số lượng" }),
    [labels, values]
  );
  const getInsights = useMemo(() => buildCategoryBarInsightGetter(labels, values, "Số lượng"), [labels, values]);
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <DashboardInteractiveChart option={option} height={248} chartTitle={chartTitle} getInsights={getInsights} />;
}

export function ProgressColumnChart({
  labels,
  values,
  chartTitle = "Tiến độ"
}: {
  labels: string[];
  values: number[];
  chartTitle?: string;
}) {
  const option = useMemo(
    () => buildPerBarColorChartOption(labels, values, PROGRESS_STATUS_COLORS, "Sinh viên"),
    [labels, values]
  );
  const getInsights = useMemo(() => buildCategoryBarInsightGetter(labels, values, "Sinh viên"), [labels, values]);
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <DashboardInteractiveChart option={option} height={248} chartTitle={chartTitle} getInsights={getInsights} />;
}

export function LineChart({
  labels,
  series,
  chartTitle = "Xu hướng"
}: {
  labels: string[];
  series: SimpleChartSeries[];
  chartTitle?: string;
}) {
  const option = useMemo(() => buildLineMultiSeriesOption(labels, series), [labels, series]);
  const getInsights = useMemo(() => buildLineAxisInsightGetter(labels, series), [labels, series]);
  if (series.length === 0 || labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;
  return <DashboardInteractiveChart option={option} height={292} chartTitle={chartTitle} getInsights={getInsights} />;
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
