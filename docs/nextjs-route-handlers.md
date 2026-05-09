# Backend API trên Next.js (App Router — Route Handlers)

Tài liệu mô tả **kiến trúc HTTP backend** trong repo này, **cách triển khai**, và **so sánh** với các hướng backend khác.

## 1. Kiến trúc tổng quan

```
Client (fetch / form)
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  middleware.ts — chỉ matcher các route UI (*không* /api) │
│  JWT cookie, redirect login, phân quyền theo prefix path │
└──────────────────────────────────────────────────────────┘
       │ (API không đi qua matcher hiện tại)
       ▼
┌──────────────────────────────────────────────────────────┐
│  app/api/**/route.ts  — Route Handlers (Edge/Node tuỳ chỗ)│
│  GET | POST | PATCH | PUT | DELETE                       │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  lib/prisma, lib/auth/*, lib/server/*, validation, mail   │
└──────────────────────────────────────────────────────────┘
```

- **Route Handler** = một file `route.ts` trong `app/api/...` export các hàm theo tên method HTTP.
- **URL** = đường dẫn thư mục dưới `app/api` (App Router), không dùng `pages/api`.
- **`middleware.ts`** trong project chỉ bảo vệ **`/admin`, `/giangvien`, `/sinhvien`, `/doanhnghiep`, `/auth/**`, `/`** (`config.matcher`). **`/api/*` không nằm trong matcher** → mọi kiểm tra session/role cho API được làm **trong từng `route.ts`** (cookie + JWT).

## 2. Quy ước triển khai trong dự án

### 2.1. Bố cục thư mục

| Prefix | Vai trò |
|--------|---------|
| `app/api/auth/*` | Đăng nhập, đăng xuất, quên/đổi mật khẩu, `me`, đăng ký DN |
| `app/api/admin/*` | CRUD & báo cáo admin |
| `app/api/giangvien/*` | GVHD: dashboard, BCTT, phân công, … |
| `app/api/sinhvien/*` | SV: hồ sơ, ứng tuyển, BCTT, … |
| `app/api/doanhnghiep/*` | DN: tin tuyển dụng, ứng viên, … |
| `app/api/files/*` | Stream file (CV, BCTT, GPKD, …) |
| `app/api/public/*` | API ít nhạy cảm (vd. danh sách khoa) |
| `app/api/vn-address/*` | Gợi ý địa giới hành chính |

Nested route ví dụ: `app/api/admin/students/[id]/route.ts` → `/api/admin/students/:id`.

### 2.2. Handler chuẩn

```ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // ...
  return NextResponse.json({ success: true, ... });
}

// Dynamic segment (Next 15): params là Promise
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // ...
}
```

- **JSON:** `NextResponse.json(body, { status })`.
- **File/binary:** `new NextResponse(buffer, { headers: { "Content-Type": ..., "Content-Disposition": ... } })`.
- **Lỗi thống nhất:** thường `{ success: false, message: "..." }` + HTTP status tương ứng (400/403/404/500).

### 2.3. Xác thực / phân quyền (API)

Tuỳ role, pattern lặp lại:

- **Admin:** `getAdminSession()` (`lib/auth/admin-session.ts`) — đọc cookie session, `verifySession`, kiểm `role === "admin"`.
- **GV / SV / DN:** đọc `cookies()` + `verifySession`, hoặc helper riêng (vd. `resolveGiangVienSupervisorProfileId` trong `lib/server/giangvien-bao-cao-thuc-tap-list.ts`), sau đó query Prisma theo `userId` / profile.

Cookie session: `SESSION_COOKIE_NAME` (`lib/constants/auth/patterns`), JWT ký/verify (`lib/auth/jwt.ts`, env `SECRET`).

### 2.4. Tách logic dùng lại

- **`lib/server/*`:** build filter `where`, fetch list dùng chung cho GET list + GET export (vd. `admin-students-list-filter.ts`, `giangvien-bao-cao-thuc-tap-list.ts`).
- **`lib/auth/*`:** session, password, identifier.
- **`lib/types/*`:** kiểu body/response dùng cho cả client và server khi phù hợp.

### 2.5. ORM & side effects

- **`lib/prisma`:** Prisma Client singleton.
- Email, blob, Cloudinary: gọi từ trong handler hoặc helper (`lib/mail`, …).

## 3. Middleware vs Route Handler

| Tiêu chí | `middleware.ts` | `app/api/.../route.ts` |
|----------|------------------|-------------------------|
| Áp dụng trong project | Chỉ các **trang** trong `matcher` | **Toàn bộ** `/api/*` |
| JWT | `jose` verify nhanh cho redirect UI | `verifySession` / helper session trong handler |
| Trách nhiệm | Không cho vào `/admin` nếu không phải admin | Trả 403 JSON nếu không đủ quyền gọi API |

**Lưu ý bảo mật:** Luôn kiểm tra quyền trong handler; không tin chỉ vì UI đã middleware (API có thể gọi trực tiếp).

## 4. Bảng so sánh: dùng Route Handlers Next vs các kiểu backend khác

| Tiêu chí | **Route Handlers (cách dự án đang dùng)** | **Server riêng (Express / Fastify / Nest)** | **tRPC + Route Handler hoặc adapter** | **Chỉ Server Actions (không REST)** |
|----------|-------------------------------------------|---------------------------------------------|--------------------------------------|-------------------------------------|
| Triển khai | Cùng repo Next, deploy một artifact | Repo/service riêng, CORS, proxy | Thêm lớp RPC + typing end-to-end | Gọi function server từ Client Component |
| Routing | filesystem `app/api` | Tự định nghĩa router | Procedure map | Không URL REST rõ ràng |
| Gọi từ mobile / bên thứ 3 | Dễ: URL + cookie/header | Dễ | Khó hơn (thường cần adapter REST) | Không thân thiện REST |
| Cache / CDN GET | Theo Next (`fetch` cache phía client khác với route config) | Toàn quyền | Tuỳ setup | Không áp dụng kiểu HTTP cache cổ điển |
| Timeout / region | Theo platform (Vercel, …) | Tự chọn host | Tương tự Handlers | Giống Handlers |
| Type-safe client | Thủ công hoặc codegen OpenAPI | OpenAPI / client gen | Rất tốt | Tốt trong monolith TS |
| File upload / stream | Hỗ trợ `Request`/`Response` Web API | Quen thuộc | Tuỳ | Form + Action |

**Kết luận cho repo này:** Route Handlers phù hợp **ứng dụng web monolith**, **cookie session**, **nhiều module role-based REST**, không bắt buộc mobile app REST public rộng. Nếu sau này cần **API versioning** hoặc **microservice**, có thể tách dần domain sang service riêng vẫn giữ Next làm BFF.

## 5. Tham chiếu nhanh

- Middleware: `middleware.ts`
- Guard prefix UI: `lib/constants/auth/guards.ts`, `lib/constants/routing.ts`
- Ví dụ handler đơn giản: `app/api/auth/login/route.ts`
- Ví dụ handler có dynamic param: `app/api/admin/job-posts/[id]/route.ts`
- Tài liệu nghiệp vụ theo role: `docs/admin.md`, `docs/giangvien.md`, …

## 6. Mở rộng / checklist khi thêm API

1. Tạo `app/api/<namespace>/<path>/route.ts`.
2. Export đúng HTTP method; dynamic route thì `await ctx.params` (Next 15).
3. Auth + validation + Prisma; tránh logic chỉ phụ thuộc middleware.
4. Thống nhất JSON `{ success, message?, ... }` với frontend hiện có.
5. Export Excel/stream: set header `Content-Type` / `Content-Disposition` (tham khảo `docs/excel.md`).
