# ECharts trong dự án

Tài liệu ngắn về **cách bundle ECharts**, **wrapper React**, và **chỗ build option** để chỉnh sửa / thêm biểu đồ.

## Vị trí trong codebase

| Thành phần | Đường dẫn |
|------------|-----------|
| Đăng ký modular (tree-shake) | `lib/echarts/register.ts` |
| Wrapper canvas + resize + click | `app/components/charts/ReactEchart.tsx` |
| CSS overlay pulse | `app/components/charts/react-echart.module.css` |
| Builder option (donut, bar, line, …) | `lib/utils/echarts-dashboard-options.ts` |
| Component dashboard admin | `app/admin/components/AdminDashboardCharts.tsx` |
| Kiểu dữ liệu chart | `lib/types/admin-dashboard.ts` |
| Màu / format dùng chung dashboard | `lib/constants/admin-dashboard-charts.ts`, `lib/constants/recharts-dashboard-ui.ts` |
| Gradient / darken | `lib/utils/chart-colors.ts` |

Hiện **chỉ admin dashboard** (`AdminDashboardCharts`) gọi `ReactEchart`. Doanh nghiệp / GV có thể dùng UI khác (Recharts, v.v.) — kiểm tra từng `dashboard`.

## Kiến trúc: `echarts/core` + `echarts.use`

Không import full `echarts`; chỉ đăng ký những gì cần trong `lib/echarts/register.ts`:

- **Charts:** `BarChart`, `LineChart`, `PieChart`
- **Components:** `Grid`, `Tooltip`, `Legend`, `Graphic`
- **Features:** `LabelLayout`, `UniversalTransition`
- **Renderer:** `CanvasRenderer`

**Thêm loại biểu đồ mới** (ví dụ `ScatterChart`):

1. `import { ScatterChart } from "echarts/charts"`
2. Thêm vào mảng `echarts.use([..., ScatterChart])`

Nếu thiếu component (vd. `TitleComponent`), biểu đồ có thể không hiển thị đúng — xem [ECharts handbook – Import on demand](https://echarts.apache.org/handbook/en/basics/import).

## Wrapper `ReactEchart`

- **`"use client"`** — ECharts chạy trên DOM.
- **`echarts.init(el, undefined, { renderer: "canvas" })`** — một instance gắn với `ref` div con.
- **`ResizeObserver`** — gọi `chart.resize()` khi khối chứa đổi kích thước.
- **`setOption(option, { notMerge: true })`** — mỗi lần `option` đổi (JSON stringify khác) thì replace full option; `replayTick` dùng để ép replay animation sau click (pulse).
- **Props:** `option`, `height` (px), `className`, `onChartClick`, `clickReloadPulse` (overlay loading ngắn + replay animation khi user click chart).

Luôn import **`echarts` runtime** từ `@/lib/echarts/register`, không import default từ `echarts` package trong component chart (tránh bundle đầy).

Kiểu TypeScript option: `import type { EChartsOption } from "echarts"` (types đi kèm package).

## Builder option (`echarts-dashboard-options.ts`)

Các hàm pure nhận dữ liệu đã chuẩn hóa → trả `EChartsOption`:

- `buildDonutChartOption`
- `buildSingleBarChartOption`
- `buildPerBarColorChartOption`
- `buildGroupedBarChartOption`
- `buildLineMultiSeriesOption`

Trong đó đã gắn:

- **Font tiếng Việt:** Canvas không kế thừa font của document — `CHART_FONT_FAMILY` / tooltip khớp `app/globals.css` (comment trong file).
- **Animation:** `CHART_MOTION` (duration / easing).
- **Tooltip / legend / axis** style thống nhất dashboard.

Thêm biểu đồ mới: nên **thêm hàm `build...Option` mới** trong file này (hoặc file utils riêng nếu module khác), rồi bọc trong component mỏng trong `AdminDashboardCharts.tsx` (giống `DonutChart`, `BarChart`).

## Luồng dữ liệu admin

1. Trang dashboard (`app/admin/dashboard/...`) gọi API overview.
2. Map payload → `DonutSegment`, `SimpleChartSeries`, v.v.
3. `useMemo(() => buildXxxOption(...), [deps])` → `<ReactEchart option={...} />`.

## Ghi chú vận hành

- **Dispose:** `useEffect` cleanup gọi `chart.dispose()` — tránh leak khi unmount.
- **Empty state:** Các chart trong `AdminDashboardCharts` trả JSX text “Chưa có dữ liệu” khi mảng rỗng — không init ECharts.
- **SSR:** Không render ECharts trên server; component đã client-only.

## Tham chiếu

- Package: `echarts` trong `package.json`.
- Tài liệu module admin chi tiết: `docs/admin.md` (phần dashboard / overview).
