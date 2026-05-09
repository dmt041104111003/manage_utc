# Tech stack chính (`manage-utc`)

Bản tóm tắt **ngôn ngữ / framework / thư viện** quan trọng và **phiên bản khai báo** trong `package.json` (thiên về môi trường dev; prod có thể dùng bản patch mới hơn nếu lockfile cho phép).

## Runtime & ngôn ngữ

| Thành phần | Phiên bản / yêu cầu |
|------------|----------------------|
| Node.js | `>=18` (`engines`) |
| TypeScript | `5.8.3` |
| JavaScript/TSX | App Router, `strict` theo `tsconfig` |

## Framework & UI core

| Thành phần | Phiên bản |
|------------|-----------|
| Next.js | `15.3.8` |
| React | `19.1.0` |
| react-dom | `19.1.0` |

## Data & ORM

| Thành phần | Phiên bản |
|------------|-----------|
| PostgreSQL | engine DB (kết nối qua `DATABASE_URL`) |
| `@prisma/client` | `^6.19.0` |
| `prisma` (CLI) | `^6.19.0` |

## Auth & bảo mật

| Thành phần | Phiên bản |
|------------|-----------|
| `jose` (JWT) | `^5.9.6` |
| `bcryptjs` | `^3.0.2` |

## Email

| Thành phần | Phiên bản |
|------------|-----------|
| `nodemailer` | `^6.9.16` |
| `@react-email/components` | `^1.0.12` |
| `@react-email/render` | `^2.0.6` |
| `react-email` (CLI dev) | `^5.2.10` |

## Lưu trữ file / media

| Thành phần | Phiên bản |
|------------|-----------|
| `@vercel/blob` | `^1.1.1` |
| `cloudinary` | `^2.7.0` |

## Báo cáo & dữ liệu dạng bảng

| Thành phần | Phiên bản |
|------------|-----------|
| `echarts` | `^5.6.0` |
| `xlsx` (SheetJS) | `^0.18.5` |

## Icon & tiện ích dev

| Thành phần | Phiên bản |
|------------|-----------|
| `react-icons` | `^5.4.0` |
| `tsx` | `^4.19.2` (chạy seed) |
| `dotenv-cli` | `^11.0.0` (script `db:*`) |

## Ghi chú

- Chi tiết kiến trúc: [`nextjs-frontend.md`](nextjs-frontend.md), [`nextjs-route-handlers.md`](nextjs-route-handlers.md), [`database.md`](database.md).
- Bản resolve chính xác từng dependency: xem `package-lock.json` trong repo.
