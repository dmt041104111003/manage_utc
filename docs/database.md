# Database — PostgreSQL & Prisma

Tài liệu mô tả **stack DB**, **schema**, **cách app kết nối**, **seed / đồng bộ schema**, và **so sánh** với các lựa chọn khác.

## 1. Kiến trúc

```
PostgreSQL (DATABASE_URL)
        │
        ▼
 prisma/schema.prisma  ──generate──►  @prisma/client
        │
        ▼
 lib/prisma.ts  →  export const prisma (singleton)
        │
        ▼
 Route Handlers / Server code  →  prisma.* hoặc (prisma as any).*
```

- **Engine:** PostgreSQL (`datasource db` trong `prisma/schema.prisma`).
- **ORM:** Prisma (`prisma-client-js`).
- **Biến môi trường:** `DATABASE_URL` (chuỗi kết nối Postgres).

## 2. Schema (`prisma/schema.prisma`)

### 2.1. Enum nghiệp vụ (rút gọn)

| Nhóm | Ví dụ |
|------|--------|
| Tài khoản | `Role`, `EnterpriseStatus` |
| Đợt / tin | `InternshipBatchStatus`, `InternshipBatchSemester`, `JobStatus`, `WorkType` |
| Ứng tuyển | `JobApplicationStatus`, `JobApplicationResponse` |
| Thực tập SV | `StudentInternshipStatus`, `StudentGender`, `StudentDegree` |
| BCTT | `InternshipReportReviewStatus` |
| GVHD | `SupervisorDegree`, `SupervisorAssignmentStatus` |

### 2.2. Model chính

| Model | Vai trò |
|-------|---------|
| `User` | Email, phone, role, mật khẩu hash; liên kết DN / profile SV-GV |
| `InternshipBatch` | Đợt thực tập (mở/đóng, học kỳ, …) |
| `StudentProfile` | MSV, lớp, khoa, khóa, trạng thái TT, địa chỉ, … |
| `SupervisorProfile` | Hồ sơ GVHD |
| `SupervisorAssignment` | Phân công GVHD theo đợt + khoa |
| `SupervisorAssignmentStudent` | Liên kết SV ↔ phân công (nhiều-nhiều qua assignment) |
| `JobPost` | Tin tuyển dụng |
| `JobApplication` | Ứng tuyển / phỏng vấn / offer |
| `InternshipReport` | File BCTT, điểm, duyệt |
| `InternshipStatusHistory` | Lịch sử đổi trạng thái TT |
| `SupervisorAssignmentStatusHistory` | Lịch sử trạng thái phân công GV |

Quan hệ chi tiết xem trực tiếp trong file schema (`@relation`, `@@index`, `@@unique`).

## 3. Client trong app (`lib/prisma.ts`)

```ts
// Singleton tránh tạo PrismaClient lặp trong dev (hot reload)
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```

- Import **`prisma`** trong Route Handlers và server utilities.
- Một số file dùng **`(prisma as any).modelName`** khi cần tránh lệch kiểu hoặc model naming — vẫn cùng một client.

## 4. Lệnh CLI (trong `package.json`)

| Script | Ý nghĩa |
|--------|---------|
| `pnpm db:push` / `npm run db:push` | `prisma db push` — đẩy schema xuống DB (phù hợp dev/prototype). `.env.local` qua `dotenv-cli`. |
| `pnpm db:seed` | Chạy `prisma/seed.ts` (tsx). |
| `pnpm db:studio` | Prisma Studio — duyệt/sửa bản ghi GUI. |
| `postinstall` / `build` | `prisma generate` — sinh `@prisma/client`. |

**Lưu ý:** Repo hiện **không** chứa thư mục `prisma/migrations` trong workspace — workflow chủ đạo là **`db push`**. Khi cần **lịch sử migration có kiểm soát** (staging/prod nghiêm), nên chuyển sang `prisma migrate dev` và commit migration SQL.

## 5. Seed (`prisma/seed.ts`)

- Upsert **tài khoản admin** mặc định (email / mật khẩu xem file — chỉ dùng môi trường dev).
- Cấu hình: block `"prisma": { "seed": "tsx prisma/seed.ts" }` trong `package.json`.

## 6. Thực hành khi đổi schema

1. Sửa `prisma/schema.prisma`.
2. `npm run db:push` (hoặc migrate nếu team chuyển workflow).
3. `npm run db:generate` không cần tách — đã có trong push/generate quen thuộc; sau push nên đảm bảo client khớp (`prisma generate` thường chạy sau push hoặc qua dev server).
4. Cập nhật code TypeScript / API nếu đổi tên field hoặc enum.

## 7. Bảng so sánh: Prisma + Postgres vs hướng khác

| Tiêu chí | **Prisma + PostgreSQL (dự án)** | **SQL thuần / pg driver** | **Drizzle** | **TypeORM** |
|----------|----------------------------------|---------------------------|-------------|-------------|
| Schema | `schema.prisma` declarative | Tự viết SQL migration | TS schema hoặc SQL | Decorator entity |
| Typing client | Generate mạnh | Tự định nghĩa | Tốt | Tốt |
| Migration | Migrate / db push | Toàn quyền | drizzle-kit | CLI riêng |
| Raw SQL | `$queryRaw` khi cần | Native | `sql` template | QueryBuilder / raw |
| Ecosystem Next | Rất phổ biến | Nhẹ nhưng thủ công | Đang tăng | Phổ biến nhưng nặng hơn |

**Phù hợp dự án:** quan hệ phức tạp (user, profile, assignment, job, report), team muốn **một schema tập trung** và **type-safe client** — Postgres + Prisma là lựa chọn hợp lý.

## 8. Tham chiếu

- Schema: `prisma/schema.prisma`
- Client: `lib/prisma.ts`
- Seed: `prisma/seed.ts`
- Luồng HTTP dùng DB: [`docs/nextjs-route-handlers.md`](nextjs-route-handlers.md)
