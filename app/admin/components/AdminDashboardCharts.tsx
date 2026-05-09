"use client";

import { useId } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
  Defs,
  LinearGradient,
  Stop
} from "recharts";

import styles from "../styles/dashboard.module.css";
import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { PROGRESS_STATUS_COLORS } from "@/lib/constants/admin-dashboard-charts";
import {
  formatChartInt,
  RECHARTS_GRID_PROPS,
  RECHARTS_GRID_PROPS_LINE,
  RECHARTS_LEGEND_WRAPPER_STYLE,
  RECHARTS_TICK_PROPS,
  RECHARTS_TOOLTIP_PROPS
} from "@/lib/constants/recharts-dashboard-ui";
import { darkenHex } from "@/lib/utils/chart-colors";

const ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: "ease-out" as const };

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const uid = useId().replace(/:/g, "");
  if (segments.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = segments.map((s) => ({ name: s.label, value: s.value, color: s.color }));
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ position: "relative", width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Defs>
            {data.map((d, i) => (
              <LinearGradient key={d.name} id={`${uid}-donut-${i}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={d.color} stopOpacity={1} />
                <Stop offset="100%" stopColor={darkenHex(d.color, 0.28)} stopOpacity={1} />
              </LinearGradient>
            ))}
          </Defs>
          <Pie
            data={data}
            cx="50%"
            cy="48%"
            innerRadius={62}
            outerRadius={96}
            paddingAngle={2.5}
            cornerRadius={4}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            {...ANIM}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={`url(#${uid}-donut-${i})`} />
            ))}
          </Pie>
          <Tooltip
            {...RECHARTS_TOOLTIP_PROPS}
            formatter={(value: number | undefined) => [formatChartInt(value), "Giá trị"]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={11}
            wrapperStyle={{ ...RECHARTS_LEGEND_WRAPPER_STYLE, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "76%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          flexDirection: "column",
          gap: 2
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>TỔNG</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.02em" }}>
          {formatChartInt(total)}
        </span>
      </div>
    </div>
  );
}

export function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const uid = useId().replace(/:/g, "");
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => ({ name, value: values[i] ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={248}>
      <RechartsBarChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 52 }}>
        <Defs>
          <LinearGradient id={`${uid}-bar-blue`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#60a5fa" />
            <Stop offset="55%" stopColor="#2563eb" />
            <Stop offset="100%" stopColor="#1e3a8a" />
          </LinearGradient>
        </Defs>
        <CartesianGrid {...RECHARTS_GRID_PROPS} />
        <XAxis
          dataKey="name"
          tick={RECHARTS_TICK_PROPS}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={70}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          tick={RECHARTS_TICK_PROPS}
          allowDecimals={false}
          width={40}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...RECHARTS_TOOLTIP_PROPS}
          formatter={(value: number | undefined) => [formatChartInt(value), "Số lượng"]}
        />
        <Bar
          dataKey="value"
          name="Số lượng"
          fill={`url(#${uid}-bar-blue)`}
          radius={[12, 12, 0, 0]}
          maxBarSize={52}
          {...ANIM}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function ProgressColumnChart({ labels, values }: { labels: string[]; values: number[] }) {
  const uid = useId().replace(/:/g, "");
  if (labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => ({
    name,
    value: values[i] ?? 0,
    color: PROGRESS_STATUS_COLORS[i % PROGRESS_STATUS_COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={248}>
      <RechartsBarChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 52 }}>
        <Defs>
          {data.map((d, i) => (
            <LinearGradient key={`${d.name}-${i}`} id={`${uid}-prog-${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={d.color} stopOpacity={1} />
              <Stop offset="100%" stopColor={darkenHex(d.color, 0.25)} stopOpacity={1} />
            </LinearGradient>
          ))}
        </Defs>
        <CartesianGrid {...RECHARTS_GRID_PROPS} />
        <XAxis
          dataKey="name"
          tick={RECHARTS_TICK_PROPS}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={70}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={40} axisLine={false} tickLine={false} />
        <Tooltip
          {...RECHARTS_TOOLTIP_PROPS}
          formatter={(value: number | undefined) => [formatChartInt(value), "Sinh viên"]}
        />
        <Bar dataKey="value" name="Sinh viên" radius={[12, 12, 0, 0]} maxBarSize={52} {...ANIM}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={`url(#${uid}-prog-${i})`} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function LineChart({ labels, series }: { labels: string[]; series: SimpleChartSeries[] }) {
  if (series.length === 0 || labels.length === 0) return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => {
    const point: Record<string, string | number> = { name };
    series.forEach((s) => {
      point[s.name] = s.data[i] ?? 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={292}>
      <RechartsLineChart data={data} margin={{ top: 16, right: 28, left: 4, bottom: 16 }}>
        <CartesianGrid {...RECHARTS_GRID_PROPS_LINE} />
        <XAxis dataKey="name" tick={RECHARTS_TICK_PROPS} axisLine={{ stroke: "#cbd5e1" }} tickLine={{ stroke: "#cbd5e1" }} />
        <YAxis tick={RECHARTS_TICK_PROPS} allowDecimals={false} width={42} axisLine={false} tickLine={false} />
        <Tooltip
          {...RECHARTS_TOOLTIP_PROPS}
          formatter={(value: number | undefined) => formatChartInt(value)}
        />
        <Legend iconType="circle" iconSize={11} wrapperStyle={RECHARTS_LEGEND_WRAPPER_STYLE} />
        {series.map((s) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2.75}
            dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: s.color }}
            activeDot={{ r: 7, strokeWidth: 0, fill: s.color }}
            {...ANIM}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
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
