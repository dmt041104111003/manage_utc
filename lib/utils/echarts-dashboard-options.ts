import type { EChartsOption } from "echarts";
import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { formatChartInt } from "@/lib/constants/recharts-dashboard-ui";
import { darkenHex } from "@/lib/utils/chart-colors";

const AXIS = {
  axisLabel: { color: "#64748b", fontSize: 11, fontWeight: 500 },
  axisLine: { lineStyle: { color: "#cbd5e1" } },
  splitLine: { lineStyle: { color: "#e2e8f0", type: [4, 6] as [number, number] } }
};

const TOOLTIP_AXIS = {
  trigger: "axis" as const,
  backgroundColor: "rgba(255,255,255,0.98)",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: "#334155", fontSize: 13 },
  axisPointer: { type: "shadow" as const, shadowStyle: { color: "rgba(15,23,42,0.06)" } }
};

const TOOLTIP_ITEM = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,0.98)",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: "#334155", fontSize: 13 }
};

const LEGEND_BOTTOM = {
  bottom: 4,
  icon: "circle",
  itemWidth: 10,
  itemHeight: 10,
  textStyle: { color: "#475569", fontSize: 12, fontWeight: 500 }
};

function linearGradient(c0: string, c1: string): { type: "linear"; x: number; y: number; x2: number; y2: number; colorStops: { offset: number; color: string }[] } {
  return {
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: c0 },
      { offset: 1, color: c1 }
    ]
  };
}

export function buildDonutChartOption(segments: DonutSegment[]): EChartsOption {
  const data = segments.map((s) => ({
    name: s.label,
    value: s.value,
    itemStyle: {
      color: linearGradient(s.color, darkenHex(s.color, 0.28)),
      borderColor: "#fff",
      borderWidth: 2,
      borderRadius: 6
    }
  }));
  const total = data.reduce((a, d) => a + (Number(d.value) || 0), 0);

  return {
    tooltip: {
      ...TOOLTIP_ITEM,
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number };
        return `${x.name ?? ""}<br/><b>${formatChartInt(x.value)}</b>`;
      }
    },
    legend: { ...LEGEND_BOTTOM, bottom: 6, left: "center" },
    graphic: [
      {
        type: "group",
        left: "center",
        top: "38%",
        children: [
          {
            type: "text",
            style: {
              text: "TỔNG",
              fontSize: 11,
              fontWeight: 600,
              fill: "#64748b",
              textAlign: "center"
            }
          },
          {
            type: "text",
            top: 18,
            style: {
              text: formatChartInt(total),
              fontSize: 26,
              fontWeight: 700,
              fill: "#0f172a",
              textAlign: "center"
            }
          }
        ]
      }
    ],
    series: [
      {
        type: "pie",
        radius: ["44%", "70%"],
        center: ["50%", "42%"],
        padAngle: 2.5,
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 4,
          itemStyle: { shadowBlur: 24, shadowColor: "rgba(15,23,42,0.18)" }
        },
        data
      }
    ]
  };
}

export function buildSingleBarChartOption(
  labels: string[],
  values: number[],
  opts?: { valueLabel?: string; gradient?: [string, string] }
): EChartsOption {
  const g = opts?.gradient ?? ["#60a5fa", "#1e3a8a"];
  const categories = labels.map((n) => n);
  const seriesData = labels.map((_, i) => ({
    value: values[i] ?? 0,
    itemStyle: {
      color: linearGradient(g[0], g[1]),
      borderRadius: [10, 10, 0, 0]
    }
  }));

  return {
    tooltip: {
      ...TOOLTIP_AXIS,
      formatter: (params: unknown) => {
        const arr = params as { name?: string; value?: number }[];
        const p = Array.isArray(arr) ? arr[0] : (params as { name?: string; value?: number });
        const name = p?.name ?? "";
        const v = p?.value ?? 0;
        return `${name}<br/><b>${formatChartInt(v)}</b> ${opts?.valueLabel ?? ""}`.trim();
      }
    },
    grid: { left: 8, right: 16, top: 16, bottom: 56, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { ...AXIS.axisLabel, rotate: 28, interval: 0 },
      axisLine: AXIS.axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      splitLine: AXIS.splitLine,
      axisLabel: AXIS.axisLabel,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: "bar",
        name: opts?.valueLabel ?? "Số lượng",
        barMaxWidth: 52,
        data: seriesData,
        emphasis: { focus: "series", itemStyle: { shadowBlur: 14, shadowColor: "rgba(37,99,235,0.35)" } }
      }
    ]
  };
}

export function buildPerBarColorChartOption(
  labels: string[],
  values: number[],
  colors: string[],
  valueAxisName: string
): EChartsOption {
  const categories = labels.map((n) => n);
  const seriesData = labels.map((_, i) => {
    const c = colors[i % colors.length];
    return {
      value: values[i] ?? 0,
      itemStyle: {
        color: linearGradient(c, darkenHex(c, 0.25)),
        borderRadius: [10, 10, 0, 0]
      }
    };
  });

  return {
    tooltip: {
      ...TOOLTIP_AXIS,
      formatter: (params: unknown) => {
        const arr = params as { name?: string; value?: number }[];
        const p = Array.isArray(arr) ? arr[0] : (params as { name?: string; value?: number });
        return `${p?.name ?? ""}<br/><b>${formatChartInt(p?.value)}</b> ${valueAxisName}`;
      }
    },
    grid: { left: 8, right: 16, top: 16, bottom: 56, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { ...AXIS.axisLabel, rotate: 28, interval: 0 },
      axisLine: AXIS.axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      splitLine: AXIS.splitLine,
      axisLabel: AXIS.axisLabel,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: "bar",
        name: valueAxisName,
        barMaxWidth: 52,
        data: seriesData,
        emphasis: { focus: "series" }
      }
    ]
  };
}

export function buildLineMultiSeriesOption(labels: string[], series: SimpleChartSeries[]): EChartsOption {
  const categories = labels.slice();
  const ser = series.map((s) => ({
    name: s.name,
    type: "line" as const,
    smooth: true,
    symbol: "circle",
    symbolSize: 8,
    showSymbol: true,
    lineStyle: { width: 3, color: s.color },
    itemStyle: { color: s.color, borderColor: "#fff", borderWidth: 2 },
    emphasis: { focus: "series", lineStyle: { width: 4 } },
    data: labels.map((_, i) => s.data[i] ?? 0)
  }));

  return {
    tooltip: {
      ...TOOLTIP_AXIS,
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params];
        let html = "";
        for (const raw of list) {
          const p = raw as { seriesName?: string; value?: number; marker?: string; name?: string };
          if (!html) html += `<b>${p.name ?? ""}</b><br/>`;
          html += `${p.marker ?? ""} ${p.seriesName ?? ""}: <b>${formatChartInt(p.value)}</b><br/>`;
        }
        return html;
      }
    },
    legend: { ...LEGEND_BOTTOM, top: 4, data: series.map((s) => s.name) },
    grid: { left: 8, right: 20, top: 44, bottom: 20, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: categories,
      axisLabel: AXIS.axisLabel,
      axisLine: AXIS.axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#e2e8f0", type: [4, 6] as [number, number] } },
      axisLabel: AXIS.axisLabel,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: ser
  };
}

export function buildGroupedBarChartOption(
  categories: string[],
  groups: { name: string; data: number[]; colorTop: string; colorBottom: string }[]
): EChartsOption {
  const series = groups.map((g) => ({
    name: g.name,
    type: "bar" as const,
    barMaxWidth: 44,
    barGap: "12%",
    itemStyle: {
      color: linearGradient(g.colorTop, g.colorBottom),
      borderRadius: [10, 10, 0, 0]
    },
    emphasis: { focus: "series" },
    data: g.data
  }));

  return {
    tooltip: {
      ...TOOLTIP_AXIS,
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params];
        let html = "";
        for (const raw of list) {
          const p = raw as { seriesName?: string; value?: number; marker?: string; name?: string };
          if (!html) html += `<b>${p.name ?? ""}</b><br/>`;
          html += `${p.marker ?? ""} ${p.seriesName ?? ""}: <b>${formatChartInt(p.value)}</b><br/>`;
        }
        return html;
      }
    },
    legend: { ...LEGEND_BOTTOM, top: 4, data: groups.map((g) => g.name) },
    grid: { left: 8, right: 16, top: 44, bottom: 52, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { ...AXIS.axisLabel, rotate: 28, interval: 0 },
      axisLine: AXIS.axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      splitLine: AXIS.splitLine,
      axisLabel: AXIS.axisLabel,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series
  };
}
