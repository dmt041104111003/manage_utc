"use client";

import styles from "../styles/dashboard.module.css";

import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { PROGRESS_STATUS_COLORS } from "@/lib/constants/admin-dashboard-charts";

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const size = 180;
  const r = 64;
  const stroke = 18;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;
  return (
    <div className={styles.chartRow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Biểu đồ tròn">
        <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        {segments.map((seg) => {
          const len = C * seg.percent;
          const dash = `${len} ${C - len}`;
          const dashOffset = -acc;
          acc += len;
          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className={styles.chartLegend}>
        {segments.length === 0 ? <div className={styles.muted}>Chưa có dữ liệu.</div> : null}
        {segments.map((seg) => (
          <div key={seg.label} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: seg.color }} aria-hidden />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendValue}>
              {seg.value} ({Math.round(seg.percent * 1000) / 10}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  labels,
  values,
  height = 160
}: {
  labels: string[];
  values: number[];
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className={styles.barChart}>
      <div className={styles.barArea} style={{ height }}>
        {values.map((v, i) => (
          <div key={`${labels[i]}-${i}`} className={styles.barCol}>
            <div
              className={styles.bar}
              style={{
                height: `${Math.round((v / max) * 100)}%`
              }}
              title={`${labels[i]}: ${v}`}
            />
            <div className={styles.barLabel} title={labels[i]}>
              {labels[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressColumnChart({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values);

  return (
    <div className={styles.barChart}>
      <div className={styles.barArea} style={{ height: 170 }}>
        {values.map((v, i) => (
          <div key={`${labels[i]}-${i}`} className={styles.barCol}>
            <div
              className={styles.bar}
              style={{
                height: `${Math.round((v / max) * 100)}%`,
                background: PROGRESS_STATUS_COLORS[i % PROGRESS_STATUS_COLORS.length]
              }}
              title={`${labels[i]}: ${v}`}
            />
            <div className={styles.barLabel} title={labels[i]}>
              {labels[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  labels,
  series
}: {
  labels: string[];
  series: SimpleChartSeries[];
}) {
  const width = 460;
  const height = 190;
  const pad = 24;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(1, ...allValues);
  const min = 0;

  const xAt = (i: number) => pad + (labels.length <= 1 ? innerW / 2 : (innerW * i) / (labels.length - 1));
  const yAt = (v: number) => pad + (innerH - ((v - min) / (max - min)) * innerH);

  return (
    <div className={styles.lineWrap}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} aria-label="Biểu đồ đường">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = pad + innerH * t;
          return <line key={idx} x1={pad} x2={width - pad} y1={y} y2={y} stroke="#f3f4f6" />;
        })}

        {series.map((s) => {
          const points = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="2" />
              {s.data.map((v, i) => (
                <circle key={`${s.name}-${i}`} cx={xAt(i)} cy={yAt(v)} r="3" fill={s.color} />
              ))}
            </g>
          );
        })}

        {/* x labels (few only) */}
        {labels.map((lab, i) => {
          if (labels.length > 7 && i % 2 === 1) return null;
          return (
            <text
              key={`${lab}-${i}`}
              x={xAt(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {lab}
            </text>
          );
        })}
      </svg>

      {series.length ? (
        <div className={styles.chartLegend} style={{ marginTop: 10 }}>
          {series.map((s) => (
            <div key={s.name} className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: s.color }} aria-hidden />
              <span className={styles.legendLabel}>{s.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.muted}>Chưa có dữ liệu.</div>
      )}
    </div>
  );
}

export function TopFieldsCard({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <article className={styles.card}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {items.length === 0 ? <div className={styles.modulePlaceholder}>Chưa có dữ liệu.</div> : null}
      {items.length ? (
        <table className={styles.dataTable} style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Lĩnh vực</th>
              <th>Số ứng tuyển</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.label}>
                <td>{it.label}</td>
                <td>{it.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </article>
  );
}

