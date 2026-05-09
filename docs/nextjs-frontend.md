# Frontend trên Next.js (App Router) — kiến trúc dự án

Tài liệu mô tả **cách tổ chức UI**, **Server vs Client Components**, **layout theo role**, và **bảng so sánh** với các hướng frontend khác. Bổ sung cho [`docs/nextjs-route-handlers.md`](nextjs-route-handlers.md) (backend).

## 1. Kiến trúc tổng quan

```
app/layout.tsx          ← Root: html/body, globals.css, metadata
    │
    ├── app/auth/layout.tsx
    ├── app/admin/layout.tsx      ─┐
    ├── app/giangvien/layout.tsx   │ async Server Layout
    ├── app/sinhvien/layout.tsx    │ → DashboardShell ("use client")
    └── app/doanhnghiep/layout.tsx ┘
              │
              └── app/<role>/<feature>/page.tsx  ← hầu hết "use client"
                        │
                        ├── components/*.tsx (popup, table, toolbar)
                        ├── fetch → /api/...
                        └── hooks/, lib/utils/client-query-cache
```

- **Điều hướng:** `next/link`, `usePathname` (trong client shell).
- **Dữ liệu:** chủ yếu **`fetch` từ Client Component** tới Route Handlers (`/api/...`), cookie session gửi kèm mặc định.
- **Bảo vệ route UI:** `middleware.ts` (JWT + prefix role) — không thay thế kiểm tra API.

## 2. Triển khai trong repo

### 2.1. Root layout

- `app/layout.tsx`: `Metadata`, import `globals.css` + `data-table-responsive.css`, bọc `{children}` trong `<body>`.

### 2.2. Layout theo vai trò

Mỗi role có `app/<role>/layout.tsx` dạng **Server Component** (`async`):

- Gọi helper server (vd. `getDashboardSidebarDisplayName()` trong `lib/auth/dashboard-display-name.ts`) để lấy **tên hiển thị sidebar** (DN/GV/SV/admin).
- Render **`DashboardShell`** (`app/components/DashboardShell.tsx`, `"use client"`) với `role` + `brandName`.

`DashboardShell` gom: sidebar theo `lib/constants/dashboard-shell`, top bar, logout, nav icon map, badge (vd. DN chờ duyệt).

### 2.3. Trang (`page.tsx`)

- **Pattern phổ biến:** `"use client"` ở đầu file — state, `useEffect`, form, bảng phân trang, popup.
- **Dashboard admin charts:** client page import chart wrappers từ `app/admin/components/AdminDashboardCharts.tsx` (ECharts qua `ReactEchart` — xem [`docs/echarts.md`](echarts.md)).
- **Code splitting:** `next/dynamic` cho popup nặng (`ssr: false`) khi cần.

### 2.4. Component & style

| Khu vực | Gợi ý đường dẫn |
|---------|------------------|
| Shell chung dashboard | `app/components/DashboardShell.tsx`, `dashboard-shell.module.css` |
| Thống kê / chart admin | `app/admin/components/AdminDashboardCharts.tsx` |
| Module theo role | `app/<role>/<feature>/components/*.tsx` |
| Style dashboard admin | `app/admin/styles/dashboard.module.css` (import tương đối từ page con) |
| Popup / form dùng chung | `app/components/` (vd. `MessagePopup`, `FormPopup`) |

**CSS Module:** `import styles from "...module.css"` — class cục bộ, tránh xung đột.

### 2.5. Dữ liệu & cache phía client

- **`getOrFetchCached` / `deleteCacheByPrefix`** (`lib/utils/client-query-cache.ts`): cache in-memory theo key (vd. `admin:students:list:...`) để giảm refetch khi chuyển tab hoặc mở lại trang trong session.
- Sau logout shell có thể xóa keys cache localStorage (xem `DashboardShell`).
- **Không** nhầm với Server Components cache của Next — đây là cache JS trên trình duyệt.

### 2.6. Kiểu & hằng số

- **`lib/types/*`:** kiểu dùng chung FE/API.
- **`lib/constants/*`:** nhãn select, regex, nav, màu chart, …

### 2.7. Auth UI

- Trang auth dưới `app/auth/*`: đăng nhập, đăng ký DN, quên/đổi mật khẩu — thường client form + `POST /api/auth/...`.

## 3. Server Component vs Client Component (trong thực tế dự án)

| Khía cạnh | Server Component (ÍT dùng cho page tính năng) | Client Component (CHỦ ĐẠO cho page) |
|-----------|-----------------------------------------------|-------------------------------------|
| Ví dụ | `app/admin/layout.tsx` | Hầu hết `app/**/page.tsx` CRUD |
| Lý do | Đọc session/display name trước khi hydrate shell | `useState`, bảng, popup, `fetch` sau mount |
| Secrets | Chỉ server | Không đưa secret vào client |

Có thể dần **chuyển một phần** sang Server Components + `fetch` cache cho trang ít tương tác; hiện codebase ưu tiên một model thống nhất (client page + REST).

## 4. Bảng so sánh: stack frontend hiện tại vs hướng khác

| Tiêu chí | **Next App Router (như dự án)** | **SPA (Vite + React Router)** | **Next Pages Router** | **Remix** |
|-----------|--------------------------------|------------------------------|----------------------|-----------|
| Routing | Thư mục `app/` | Cấu hình router tay | Thư mục `pages/` | File-based + loaders |
| Layout lồng nhau | `layout.tsx` native | Tự bọc hoặc outlet | `_app` / layout hạn chế | Nested layouts mạnh |
| SSR/SEO từng trang | Tuỳ RSC/client | Thường CSR hoặc meta build | `getServerSideProps` | Loader SSR |
| API | Cùng host `/api` | Backend tách | Tương tự App Router | `action`/`loader` + fetch |
| Deploy một app | Thuận tiện | FE/BE tách | Thuận tiện | Thuận tiện |

**Phù hợp dự án:** dashboard nội bộ nhiều tương tác, cookie session, một codebase — **App Router + Client pages + Route Handlers** là đường đi ngắn và nhất quán.

## 5. Tham chiếu nhanh

- Middleware UI: `middleware.ts`
- Shell: `app/components/DashboardShell.tsx`
- Constants nav: `lib/constants/dashboard-shell.ts`, `lib/constants/dashboard-nav.ts`
- Tài liệu Excel/ECharts/API: [`docs/excel.md`](excel.md), [`docs/echarts.md`](echarts.md), [`docs/nextjs-route-handlers.md`](nextjs-route-handlers.md)

## 6. Checklist khi thêm màn hình mới

1. Tạo route dưới đúng role: `app/<role>/<đường-dẫn>/page.tsx`.
2. Thêm mục menu trong constant nav (nếu cần hiện sidebar).
3. `"use client"` nếu dùng hooks/state; tách popup/table ra `components/`.
4. Gọi API đúng prefix role (`/api/admin/...`, `/api/giangvien/...`, …).
5. Sau mutation quan trọng: `deleteCacheByPrefix` hoặc `force: true` khi reload list (theo pattern trang hiện có).
