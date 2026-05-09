"use client";

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
  Line
} from "recharts";

import styles from "../styles/dashboard.module.css";
import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { PROGRESS_STATUS_COLORS } from "@/lib/constants/admin-dashboard-charts";

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  if (segments.length === 0)
    return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = segments.map((s) => ({ name: s.label, value: s.value, color: s.color }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  if (labels.length === 0)
    return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => ({ name, value: values[i] ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
        <Tooltip />
        <Bar dataKey="value" name="Số lượng" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function ProgressColumnChart({
  labels,
  values
}: {
  labels: string[];
  values: number[];
}) {
  if (labels.length === 0)
    return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => ({ name, value: values[i] ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
        <Tooltip />
        <Bar dataKey="value" name="Sinh viên" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={PROGRESS_STATUS_COLORS[i % PROGRESS_STATUS_COLORS.length]} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function LineChart({
  labels,
  series
}: {
  labels: string[];
  series: SimpleChartSeries[];
}) {
  if (series.length === 0 || labels.length === 0)
    return <div className={styles.muted}>Chưa có dữ liệu.</div>;

  const data = labels.map((name, i) => {
    const point: Record<string, string | number> = { name };
    series.forEach((s) => { point[s.name] = s.data[i] ?? 0; });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 24, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
        <Tooltip />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
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
