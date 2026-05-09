import type { DonutSegment, SimpleChartSeries } from "@/lib/types/admin-dashboard";
import { formatChartInt } from "@/lib/constants/recharts-dashboard-ui";

export type ChartInsightMetric = { label: string; value: string; sub?: string };

export type ChartInsight = {
  headline: string;
  metrics: ChartInsightMetric[];
  bullets: string[];
};

function pct(n: number, d: number): string {
  if (d <= 0) return "0%";
  return `${((100 * n) / d).toFixed(1)}%`;
}

export function buildDonutInsightGetter(segments: DonutSegment[], total: number): (params: unknown) => ChartInsight {
  return (raw) => {
    const p = raw as { name?: string; value?: number; percent?: number };
    const name = p.name ?? "—";
    const value = Number(p.value) || 0;
    const share = typeof p.percent === "number" ? `${p.percent.toFixed(1)}%` : pct(value, total);
    const others = total - value;
    const rank = [...segments].sort((a, b) => b.value - a.value).findIndex((s) => s.label === name) + 1;
    return {
      headline: name,
      metrics: [
        { label: "Giá trị", value: formatChartInt(value), sub: "Đơn vị đếm theo biểu đồ" },
        { label: "Tỷ trọng", value: share, sub: `Trên tổng ${formatChartInt(total)}` },
        { label: "Còn lại (các phần khác)", value: formatChartInt(Math.max(0, others)), sub: "Tổng các mục còn lại" }
      ],
      bullets: [
        rank > 0 ? `Xếp hạng ${rank}/${segments.length} theo lượng lớn nhất → nhỏ nhất.` : "So sánh nhanh giữa các phần trên biểu đồ.",
        total > 0 ? `Một phần ~${share} tổng khối lượng — phù hợp để ưu tiên xử lý hoặc truyền thông.` : "Chưa có tổng để so sánh.",
        "Dữ liệu theo bộ lọc khoa / đợt hiện tại trên dashboard."
      ]
    };
  };
}

export function buildCategoryBarInsightGetter(
  labels: string[],
  values: number[],
  unit: string
): (params: unknown) => ChartInsight {
  return (raw) => {
    const p = raw as { name?: string; value?: number; dataIndex?: number };
    const name = p.name ?? labels[p.dataIndex ?? -1] ?? "—";
    const idx = typeof p.dataIndex === "number" ? p.dataIndex : labels.indexOf(name);
    const value = typeof p.value === "number" ? p.value : idx >= 0 ? (values[idx] ?? 0) : 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values, 0);
    const min = values.length ? Math.min(...values) : 0;
    const vsMax = max > 0 ? `${((100 * value) / max).toFixed(0)}%` : "—";
    return {
      headline: name,
      metrics: [
        { label: unit, value: formatChartInt(value), sub: "Tại danh mục đã chọn" },
        { label: "So với max trong nhóm", value: vsMax, sub: `Max ${formatChartInt(max)}` },
        { label: "Đóng góp vào tổng cột", value: pct(value, sum), sub: `Tổng ${formatChartInt(sum)}` }
      ],
      bullets: [
        value === max && max > 0 ? "Đây là mức cao nhất trong nhóm — điểm nóng cần theo dõi." : value === min && sum > 0 ? "Mức thấp trong nhóm — có thể cần kích hoạt thêm." : "So sánh tương đối với các danh mục còn lại.",
        `Chênh max–min hiện tại: ${formatChartInt(max - min)} (${unit}).`,
        "Số liệu theo snapshot dashboard; đổi bộ lọc để xem phân bổ khác."
      ]
    };
  };
}

export function buildLineAxisInsightGetter(
  labels: string[],
  series: SimpleChartSeries[]
): (params: unknown) => ChartInsight {
  return (raw) => {
    const list = Array.isArray(raw) ? raw : [raw];
    const first = list[0] as { name?: string; axisValue?: string } | undefined;
    const period = first?.name ?? first?.axisValue ?? "—";
    const rows = list.map((item) => {
      const x = item as { seriesName?: string; value?: number | string };
      return { seriesName: x.seriesName ?? "—", value: Number(x.value) || 0 };
    });
    const totalAt = rows.reduce((a, r) => a + r.value, 0);
    const best = rows.reduce((a, r) => (r.value > a.value ? r : a), { seriesName: "—", value: -1 });
    const idx = labels.indexOf(period);
    const prev = idx > 0 ? idx - 1 : -1;
    let deltaNote = "";
    if (prev >= 0 && series.length) {
      const curSum = series.reduce((a, s) => a + (s.data[idx] ?? 0), 0);
      const prevSum = series.reduce((a, s) => a + (s.data[prev] ?? 0), 0);
      if (prevSum > 0) {
        const d = ((100 * (curSum - prevSum)) / prevSum).toFixed(1);
        deltaNote = `Tổng các chuỗi tại kỳ này so kỳ trước (${labels[prev]}): ${d}%`;
      }
    }
    return {
      headline: period,
      metrics: rows.slice(0, 4).map((r) => ({
        label: r.seriesName,
        value: formatChartInt(r.value),
        sub: totalAt > 0 ? pct(r.value, totalAt) + " trong kỳ" : undefined
      })),
      bullets: [
        best.value >= 0 ? `Chuỗi dẫn tại kỳ: ${best.seriesName} (${formatChartInt(best.value)}).` : "Chọn điểm khác trên trục để so sánh.",
        totalAt > 0 ? `Tổng cộng tại kỳ: ${formatChartInt(totalAt)} (tất cả chuỗi).` : "Chưa có giá trị tại kỳ này.",
        deltaNote || "So sánh xu hướng theo các kỳ liền kề để thấy gia tốc tăng/giảm."
      ]
    };
  };
}

export type GroupedSeriesSlice = { name: string; data: number[] };

export function buildGroupedBarInsightGetter(
  categories: string[],
  groups: GroupedSeriesSlice[]
): (params: unknown) => ChartInsight {
  return (raw) => {
    const p = raw as { name?: string; seriesName?: string; value?: number; dataIndex?: number };
    const cat = p.name ?? categories[p.dataIndex ?? -1] ?? "—";
    const idx = typeof p.dataIndex === "number" ? p.dataIndex : categories.indexOf(cat);
    const slice = groups.map((g) => ({ name: g.name, value: idx >= 0 ? (g.data[idx] ?? 0) : 0 }));
    const sum = slice.reduce((a, s) => a + s.value, 0);
    const clicked = p.seriesName
      ? slice.find((s) => s.name === p.seriesName)
      : slice.sort((a, b) => b.value - a.value)[0];
    const headline = p.seriesName ? `${cat} · ${p.seriesName}` : cat;
    return {
      headline,
      metrics: slice.map((s) => ({
        label: s.name,
        value: formatChartInt(s.value),
        sub: sum > 0 ? pct(s.value, sum) + " trong nhóm" : undefined
      })),
      bullets: [
        clicked ? `Điểm nhấn: ${clicked.name} = ${formatChartInt(clicked.value)} tại «${cat}».` : "Chọn một cột để xem tách lớp.",
        sum > 0 ? `Tổng hai lớp tại danh mục: ${formatChartInt(sum)}.` : "Không có khối lượng tại danh mục này.",
        "Biểu đồ chồng giúp thấy cân bằng chấp nhận / từ chối (hoặc các nhóm tương tự) theo từng khoa."
      ]
    };
  };
}
