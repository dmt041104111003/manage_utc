/** Dùng chung cho Tooltip / grid / tick Recharts (admin + DN + GV) */

export const RECHARTS_TOOLTIP_PROPS = {
  cursor: { fill: "rgba(15, 23, 42, 0.05)" },
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.12)",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.98)"
  },
  labelStyle: { color: "#334155", fontWeight: 600, fontSize: 13, marginBottom: 4 },
  itemStyle: { color: "#475569", fontSize: 13, paddingTop: 2 }
} as const;

export const RECHARTS_LEGEND_WRAPPER_STYLE = {
  paddingTop: 16,
  fontSize: 12,
  fontWeight: 500,
  color: "#475569"
} as const;

export const RECHARTS_GRID_PROPS = {
  stroke: "#e2e8f0",
  strokeDasharray: "4 6",
  vertical: false,
  strokeOpacity: 0.95
} as const;

export const RECHARTS_GRID_PROPS_LINE = {
  stroke: "#e2e8f0",
  strokeDasharray: "4 6",
  strokeOpacity: 0.9
} as const;

export const RECHARTS_TICK_PROPS = {
  fontSize: 11,
  fill: "#64748b",
  fontWeight: 500
} as const;

export function formatChartInt(value: number | string | undefined): string {
  if (value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("vi-VN");
}
