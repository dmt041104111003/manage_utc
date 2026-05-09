# Luồng xác thực (Auth)

---

## Bảng tổng quan

| Vai trò | Sau đăng nhập thành công | Quên & đặt lại MK | Đổi MK | Đăng ký |
|--------|--------------------------|--------------------|---------|---------| 
| **Admin** | `/admin/dashboard` | Không | Không | Không (seed/quản trị) |
| **Giảng viên** | `/giangvien/dashboard` | Có | Có | Không |
| **Sinh viên** | `/sinhvien/dashboard` | Có | Có | Không |
| **Doanh nghiệp** | `/doanhnghiep/dashboard` | Có (khi đã duyệt) | Có (khi đã duyệt) | Có — `/auth/dangky` → chờ phê duyệt |

Cookie phiên: `session` (JWT ~7 ngày).

---

## Tech Stack

### Thư viện & công nghệ cốt lõi

| Lớp | Thư viện / Module | Vai trò |
|-----|-------------------|---------|
| Framework | **Next.js 15** (App Router) | Route handlers, middleware, pages |
| ORM | **Prisma** (`@prisma/client`) | Truy vấn DB (PostgreSQL) |
| JWT | **`jose`** | Ký/verify token phiên (`signSession`, `verifySession`), token đặt lại MK (`signPasswordResetToken`, `verifyPasswordResetToken`) |
| Mã hoá mật khẩu | **`bcryptjs`** | `hashPassword`, `verifyPassword` |
| Email | **`nodemailer`** | Gửi mail qua SMTP (`sendMail` trong `lib/mail.ts`) |
| Cookie | Next.js `cookies()` / `response.cookies` | Lưu JWT phiên dưới tên `SESSION_COOKIE_NAME` |

### Cấu trúc thư mục auth

```
app/
├── api/auth/
│   ├── login/route.ts              # POST – đăng nhập
│   ├── logout/route.ts             # POST – đăng xuất
│   ├── me/route.ts                 # GET  – lấy thông tin phiên
│   ├── forgot-password/route.ts    # POST – gửi email đặt lại MK
│   ├── reset-password/route.ts     # POST – đặt lại MK bằng token
│   ├── change-password/route.ts    # POST – đổi MK khi đã login
│   └── register-enterprise/route.ts# POST – đăng ký tài khoản DN
│
├── auth/
│   ├── dangnhap/page.tsx           # UI đăng nhập
│   ├── quenmatkhau/page.tsx        # UI quên mật khẩu
│   ├── datlaimatkhau/page.tsx      # UI đặt lại mật khẩu
│   ├── doimatkhau/page.tsx         # UI đổi mật khẩu (cần phiên)
│   └── dangky/page.tsx             # UI đăng ký doanh nghiệp

lib/
├── auth/
│   ├── jwt.ts                      # signSession, verifySession, signPasswordResetToken, verifyPasswordResetToken, getSecretKey
│   ├── password.ts                 # hashPassword, verifyPassword (bcryptjs)
│   ├── identifier.ts               # resolveLoginEmail (map "admin" → email thật)
│   └── admin-session.ts            # getAdminSession (helper server-side)
├── mail.ts                         # sendMail (nodemailer)
├── mail-layout.ts                  # buildMailShell, escapeHtml, mailCalloutHtml
├── mail-password-reset.ts          # buildPasswordResetMail, sendPasswordResetEmail
├── mail-enterprise.ts              # sendEnterpriseApprovedEmail, sendEnterpriseRejectedEmail, getPublicAppUrl
├── prisma.ts                       # export prisma (PrismaClient singleton)
└── constants/
    ├── auth/patterns.ts            # SESSION_COOKIE_NAME, ...
    ├── auth/guards.ts              # AUTH_EXACT_ROUTES_REQUIRE_SESSION, ROLE_PROTECTED_ROUTE_PREFIXES
    └── routing.ts                  # ROLE_HOME (map role → home URL)

middleware.ts                       # Bảo vệ route, redirect theo role (dùng jose.jwtVerify trực tiếp)
```

### Luồng dữ liệu kỹ thuật chung

```
Cookie "session" (JWT)
  └── ký bởi   lib/auth/jwt.ts → signSession()          [jose.SignJWT]
  └── verify bởi lib/auth/jwt.ts → verifySession()      [jose.jwtVerify]
               middleware.ts → jwtVerify() trực tiếp    [jose.jwtVerify]

Token đặt lại MK (JWT 15 phút, qua email)
  └── ký bởi   lib/auth/jwt.ts → signPasswordResetToken()
  └── verify bởi lib/auth/jwt.ts → verifyPasswordResetToken()

Mật khẩu
  └── hash bởi  lib/auth/password.ts → hashPassword()   [bcryptjs.hash]
  └── check bởi lib/auth/password.ts → verifyPassword() [bcryptjs.compare]

Email
  └── lib/mail.ts → sendMail()                          [nodemailer + Gmail SMTP]
      ├── lib/mail-password-reset.ts → sendPasswordResetEmail()
      └── lib/mail-enterprise.ts → sendEnterpriseApprovedEmail/RejectedEmail()
```

---

## Email

### Cấu hình & hạ tầng

| Biến môi trường | Mô tả |
|----------------|-------|
| `EMAIL_FROM` | Địa chỉ Gmail dùng để gửi (cũng là `auth.user` của SMTP) |
| `EMAIL_PASSWORD` | App Password của Gmail (không phải mật khẩu đăng nhập Google) |
| `EMAIL_FROM_NAME` | Tên hiển thị người gửi, mặc định `"Hệ thống thực tập UTC"` |
| `APP_URL` | URL public của ứng dụng — dùng để tạo link trong email (`VERCEL_URL` là fallback) |
| `SUPPORT_EMAIL` | Email hỗ trợ hiển thị trong footer mail |
| `SCHOOL_HOTLINE` | Số điện thoại hotline hiển thị trong email |

**Transport:** `nodemailer.createTransport({ service: "gmail", auth: { user, pass } })` — tạo mới mỗi lần gọi `sendMail()`.

### Kiến trúc pipeline email

```
Caller (API route)
    │
    ├─ lib/mail-password-reset.ts
    │      buildPasswordResetMail(fullName, role, resetUrl)
    │        → subject, text (plain), html
    │      sendPasswordResetEmail(to, fullName, role, resetUrl)
    │        → gọi sendMail()
    │
    ├─ lib/mail-enterprise.ts
    │      sendEnterpriseApprovedEmail(to, companyName, loginEmail)
    │        buildApprovedHtml()  → { text, bodyHtml }
    │        buildMailShell({ bodyHtml }) → html hoàn chỉnh
    │        → gọi sendMail()
    │
    │      sendEnterpriseRejectedEmail(to, reasons[], companyName)
    │        buildRejectedHtml() → { text, bodyHtml }
    │        buildMailShell({ bodyHtml }) → html hoàn chỉnh
    │        → gọi sendMail()
    │
    └─ lib/mail.ts → sendMail(to, subject, text, htmlOverride?)
           createTransport()  [nodemailer Gmail SMTP]
           buildMailShell({ bodyHtml: fallback từ text })  ← nếu không có htmlOverride
           transport.sendMail({ from, to, subject, text, html })
```

### Cấu trúc HTML email (`lib/mail-layout.ts`)

Mọi email đều được bọc trong **`buildMailShell()`** — tạo ra 1 file HTML hoàn chỉnh gồm 3 vùng:

```
┌─────────────────────────────────────────────────────┐
│  HEADER  (buildHeader)                              │
│  · Nền xanh đậm #005bac                             │
│  · "Bộ Giáo dục và Đào tạo"                        │
│  · Tên trường (SCHOOL_FULL_NAME)                    │
│  · "Phòng Đào tạo · Hệ thống Quản lý Thực tập"    │
├─────────────────────────────────────────────────────┤
│  BODY  (bodyHtml — nội dung từng loại mail)         │
│  · Màu sắc theo MAIL_ACCENT (primary #005bac)       │
│  · Callout box: mailCalloutHtml(variant, title, html)│
│    variants: info / success / warning / danger      │
├─────────────────────────────────────────────────────┤
│  BELOW CARD  (belowCardHtml — tuỳ chọn)             │
│  · Link dự phòng nếu nút CTA không hoạt động        │
├─────────────────────────────────────────────────────┤
│  FOOTER  (buildFooter)                              │
│  · Nền tối #1f2937                                  │
│  · Địa chỉ, hotline, email hỗ trợ, website          │
│  · "Email gửi tự động — vui lòng không reply"       │
└─────────────────────────────────────────────────────┘
```

**Palette màu `MAIL_ACCENT`:**

| Key | Mã màu | Dùng cho |
|-----|--------|----------|
| `primary` | `#005bac` | Header, nút CTA, link |
| `primaryDark` | `#004a8a` | Viền trên header |
| `success` | `#027a48` | Callout duyệt thành công |
| `danger` | `#b42318` | Callout từ chối / cảnh báo đỏ |
| `warning` | `#92400e` | Callout cảnh báo vàng |
| `muted` | `#5b6470` | Text phụ, footer |
| `text` | `#1f2937` | Text chính |

### Danh sách email theo sự kiện

```mermaid
flowchart TD
    subgraph QMK["Quên & Đặt lại mật khẩu"]
        A1[GV / SV / DN nhập email\n/auth/quenmatkhau] --> A2[forgot-password/route.ts\nsignPasswordResetToken]
        A2 --> A3[sendPasswordResetEmail\nmail-password-reset.ts]
        A3 --> A4["Email: Đặt lại mật khẩu\nChủ đề: [Tên trường] - Yêu cầu đặt lại mật khẩu\nNội dung: Link JWT 15 phút + nút CTA\nCallout: warning – Lưu ý bảo mật"]
    end

    subgraph DN["Đăng ký & Duyệt Doanh nghiệp"]
        B1[DN đăng ký\n/auth/dangky] --> B2[register-enterprise/route.ts\nprisma.user.create]
        B2 --> B3[sendMail – tiếp nhận hồ sơ cho DN]
        B2 --> B4[sendMail – thông báo Admin]

        B5[Admin duyệt\n/admin/quan-ly-tai-khoan] --> B6{Kết quả}
        B6 -->|APPROVED| B7[sendEnterpriseApprovedEmail\nmail-enterprise.ts]
        B7 --> B8["Email: Phê duyệt thành công\nChủ đề: [Phòng ĐT] - Thông báo phê duyệt...\nNội dung: Thông tin đăng nhập\n(URL, email, MK tạm = MST)\nCallout: success"]
        B6 -->|REJECTED| B9[sendEnterpriseRejectedEmail\nmail-enterprise.ts]
        B9 --> B10["Email: Từ chối đăng ký\nChủ đề: [Phòng ĐT] - Thông báo kết quả...\nNội dung: Danh sách lý do từ chối\n+ nút MỞ TRANG ĐĂNG KÝ\nCallout: warning"]
    end
```

### Chi tiết từng loại email

#### 1. Đặt lại mật khẩu
- **File:** `lib/mail-password-reset.ts` → `sendPasswordResetEmail(to, fullName, role, resetUrl)`
- **Trigger:** `POST /api/auth/forgot-password` (role ≠ admin, tài khoản không khóa)
- **Người nhận:** GV / SV / DN — địa chỉ email tài khoản
- **Chủ đề:** `[Tên trường] - Yêu cầu đặt lại mật khẩu tài khoản`
- **Nội dung:**
  - Chào đích danh (`fullName`)
  - Xác nhận nhận yêu cầu đặt lại MK
  - Nút CTA **"ĐẶT LẠI MẬT KHẨU"** → `resetUrl` = `/auth/datlaimatkhau?email=...&token=...`
  - Callout `warning`: token hết hạn 15 phút, không chia sẻ link
  - Link dự phòng dạng text (belowCardHtml)
- **Token:** JWT signed bởi `signPasswordResetToken()`, expiry 15 phút

#### 2. Phê duyệt doanh nghiệp thành công
- **File:** `lib/mail-enterprise.ts` → `sendEnterpriseApprovedEmail(to, companyName, loginEmail)`
- **Trigger:** Admin cập nhật `enterpriseStatus = APPROVED` trong `/admin/quan-ly-tai-khoan`
- **Người nhận:** Email đăng ký của doanh nghiệp
- **Chủ đề:** `[Phòng Đào tạo – Tên trường] - Thông báo phê duyệt tài khoản kết nối thực tập thành công`
- **Nội dung:**
  - Thông báo hồ sơ đã được phê duyệt
  - Bảng thông tin đăng nhập: URL hệ thống, email đăng nhập, mật khẩu tạm = MST
  - Callout `success`: yêu cầu đổi MK ngay lần đầu đăng nhập
  - Thông tin liên hệ hỗ trợ (email + hotline)

#### 3. Từ chối đăng ký doanh nghiệp
- **File:** `lib/mail-enterprise.ts` → `sendEnterpriseRejectedEmail(to, reasons[], companyName)`
- **Trigger:** Admin cập nhật `enterpriseStatus = REJECTED`
- **Người nhận:** Email đăng ký của doanh nghiệp
- **Chủ đề:** `[Phòng Đào tạo – Tên trường] - Thông báo kết quả đăng ký tài khoản kết nối thực tập`
- **Nội dung:**
  - Thông báo hồ sơ chưa được phê duyệt
  - Danh sách lý do (`reasons[]`) dạng ordered list với callout `danger`
  - Callout `warning` + nút **"MỞ TRANG ĐĂNG KÝ"** → `/auth/dangky` để nộp lại
  - Hotline hỗ trợ

### Sơ đồ sequence gửi email

```mermaid
sequenceDiagram
    participant API as API Route
    participant PwdReset as lib/mail-password-reset.ts
    participant EntMail as lib/mail-enterprise.ts
    participant Layout as lib/mail-layout.ts<br/>buildMailShell()
    participant Mail as lib/mail.ts<br/>sendMail()
    participant SMTP as Gmail SMTP<br/>(nodemailer)
    participant Inbox as Hộp thư người nhận

    Note over API,Inbox: ── Quên mật khẩu ──
    API->>PwdReset: sendPasswordResetEmail(to, fullName, role, resetUrl)
    PwdReset->>PwdReset: buildPasswordResetMail()<br/>→ subject, text, bodyHtml
    PwdReset->>Layout: buildMailShell({ bodyHtml, belowCardHtml })
    Layout-->>PwdReset: html (full document)
    PwdReset->>Mail: sendMail(to, subject, text, html)
    Mail->>Mail: createTransport() [nodemailer Gmail]
    Mail->>SMTP: transport.sendMail({ from, to, subject, text, html })
    SMTP-->>Inbox: Email "Đặt lại mật khẩu"

    Note over API,Inbox: ── Doanh nghiệp được duyệt ──
    API->>EntMail: sendEnterpriseApprovedEmail(to, companyName, loginEmail)
    EntMail->>EntMail: getPublicAppUrl() → loginPath
    EntMail->>EntMail: buildApprovedHtml() → { text, bodyHtml }
    EntMail->>Layout: buildMailShell({ bodyHtml })
    Layout-->>EntMail: html
    EntMail->>Mail: sendMail(to, subject, text, html)
    Mail->>SMTP: transport.sendMail(...)
    SMTP-->>Inbox: Email "Phê duyệt thành công"

    Note over API,Inbox: ── Doanh nghiệp bị từ chối ──
    API->>EntMail: sendEnterpriseRejectedEmail(to, reasons[], companyName)
    EntMail->>EntMail: getPublicAppUrl() → registerLink
    EntMail->>EntMail: buildRejectedHtml() → { text, bodyHtml }
    EntMail->>Layout: buildMailShell({ bodyHtml })
    Layout-->>EntMail: html
    EntMail->>Mail: sendMail(to, subject, text, html)
    Mail->>SMTP: transport.sendMail(...)
    SMTP-->>Inbox: Email "Từ chối đăng ký"
```

---

## 1. Admin

### Đặc điểm
- Tài khoản tạo bằng seed / quản trị DB — không có form đăng ký.
- Đăng nhập bằng `admin` hoặc `admin@utc.edu.vn` (hệ thống tự map).
- Không có luồng quên/đặt lại/đổi mật khẩu qua web.
- Link **"Quên mật khẩu?"** bị ẩn khi phát hiện email admin.

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as app/auth/dangnhap/page.tsx<br/>LoginPage → LoginForm
    participant MW as middleware.ts<br/>middleware()
    participant API as app/api/auth/login/route.ts<br/>POST()
    participant Lib as lib/auth/
    participant DB as lib/prisma.ts<br/>prisma.user.findUnique()
    participant Cookie

    Note over Admin,Cookie: ── Đăng nhập ──
    Admin->>Page: Nhập "admin" + mật khẩu
    Page->>Page: fetch("/api/auth/login")
    Page->>API: POST /api/auth/login { identifier, password }
    API->>Lib: identifier.ts → resolveLoginEmail("admin")<br/>→ "admin@utc.edu.vn"
    API->>DB: prisma.user.findUnique({ where: { email } })
    DB-->>API: User record
    API->>Lib: password.ts → verifyPassword(plain, hash)<br/>[bcryptjs.compare]
    alt Hợp lệ + không khóa
        API->>Lib: jwt.ts → signSession({ id, role, ... })<br/>[jose.SignJWT ~7 ngày]
        API->>Cookie: res.cookies.set(SESSION_COOKIE_NAME, jwt)
        API-->>Page: 200 { home: ROLE_HOME["admin"] = "/admin/dashboard" }
        Page->>Admin: router.push("/admin/dashboard")
    else Sai mật khẩu
        API-->>Page: 401 – thông báo lỗi
    else isLocked = true
        API-->>Page: 403 – tài khoản bị khóa
    end

    Note over Admin,Cookie: ── Mọi request tiếp theo – Middleware ──
    Admin->>MW: Vào bất kỳ route
    MW->>MW: cookies().get(SESSION_COOKIE_NAME)
    MW->>MW: jose.jwtVerify(token, getSecretKey())<br/>→ payload { role: "admin" }
    MW->>MW: ROLE_HOME["admin"] = "/admin/dashboard"
    alt Vào /auth/* hoặc /giangvien/* hoặc sai role
        MW-->>Admin: NextResponse.redirect("/admin/dashboard")
    else Route hợp lệ
        MW-->>Admin: NextResponse.next()
    end

    Note over Admin,Cookie: ── Đăng xuất ──
    Admin->>Page: Sidebar → POST /api/auth/logout
    Page->>API: POST /api/auth/logout
    Note over API: app/api/auth/logout/route.ts → POST()
    API->>Cookie: res.cookies.set(SESSION_COOKIE_NAME, "", maxAge=0)
    API-->>Page: 200
    Page->>Admin: router.push("/auth/dangnhap")
```

### Bảng thao tác

| Thao tác | Được phép? | Ghi chú |
|----------|------------|---------|
| Đăng nhập | Có | `admin` hoặc `admin@utc.edu.vn` |
| Đăng xuất | Có | `POST /api/auth/logout` |
| Quên / đặt lại MK | **Không** | `forgot-password` route.ts trả 403 cho admin |
| Đổi MK trên web | **Không** | `change-password` route.ts trả 403 cho admin |
| Đăng ký | **Không** | Không có flow công khai |

---

## 2. Giảng viên

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as app/auth/*/page.tsx
    participant MW as middleware.ts → middleware()
    participant API as app/api/auth/*/route.ts
    participant Lib as lib/auth/
    participant DB as prisma.user.*
    participant Mail as lib/mail-password-reset.ts<br/>sendPasswordResetEmail()
    participant Cookie

    Note over GV,Cookie: ── Đăng nhập ──
    GV->>Page: dangnhap/page.tsx → LoginPage<br/>fetch POST /api/auth/login
    Page->>API: login/route.ts → POST()
    API->>Lib: identifier.ts → resolveLoginEmail(email)
    API->>DB: prisma.user.findUnique({ where: { email }, include: enterpriseProfile })
    API->>Lib: password.ts → verifyPassword() [bcryptjs]
    API->>Lib: jwt.ts → signSession({ id, role:"giangvien" }) [jose.SignJWT]
    API->>Cookie: Set SESSION_COOKIE_NAME = JWT
    API-->>Page: 200 { home: "/giangvien/dashboard" }
    Page->>GV: router.push("/giangvien/dashboard")

    Note over GV,Cookie: ── Middleware bảo vệ route ──
    GV->>MW: Request đến /giangvien/*
    MW->>MW: jwtVerify(cookie, getSecretKey()) → { role }
    MW->>MW: Kiểm tra ROLE_PROTECTED_ROUTE_PREFIXES
    alt Role khớp
        MW-->>GV: NextResponse.next()
    else Sai role / chưa login
        MW-->>GV: redirect(ROLE_HOME[role] hoặc /auth/dangnhap)
    end

    Note over GV,Cookie: ── Quên mật khẩu ──
    GV->>Page: quenmatkhau/page.tsx → ForgotPasswordPage<br/>fetch POST /api/auth/forgot-password
    Page->>API: forgot-password/route.ts → POST()
    API->>DB: prisma.user.findUnique({ where: { email } })
    API->>API: Kiểm tra role ≠ admin + không khóa
    API->>Lib: jwt.ts → signPasswordResetToken(email) [jose.SignJWT 15 phút]
    API->>Mail: mail-password-reset.ts → sendPasswordResetEmail(user, resetUrl)<br/>→ lib/mail.ts → sendMail() [nodemailer]
    API-->>Page: 200 – kiểm tra hộp thư
    Page->>GV: Thông báo gửi email

    Note over GV,Cookie: ── Đặt lại mật khẩu (từ link email) ──
    GV->>Page: datlaimatkhau/page.tsx?token=... → ResetPasswordPage<br/>fetch POST /api/auth/reset-password
    Page->>API: reset-password/route.ts → POST() { token, newPassword }
    API->>Lib: jwt.ts → verifyPasswordResetToken(token) [jose.jwtVerify]
    alt Token hợp lệ (≤ 15 phút)
        API->>Lib: password.ts → hashPassword(newPassword) [bcryptjs.hash]
        API->>DB: prisma.user.update({ where: { email }, data: { passwordHash } })
        API-->>Page: 200
        Page->>GV: router.push("/auth/dangnhap")
    else Token hết hạn / sai
        API-->>Page: 400 – token không hợp lệ
    end

    Note over GV,Cookie: ── Đổi mật khẩu (đã login) ──
    GV->>Page: doimatkhau/page.tsx → ChangePasswordPage<br/>fetch POST /api/auth/change-password
    Page->>API: change-password/route.ts → POST()
    API->>Lib: jwt.ts → verifySession(cookies().get(SESSION_COOKIE_NAME))
    API->>DB: prisma.user.findUnique({ where: { id } })
    API->>Lib: password.ts → verifyPassword(currentPwd, hash)
    API->>Lib: password.ts → hashPassword(newPwd)
    API->>DB: prisma.user.update({ data: { passwordHash } })
    API-->>Page: 200 – đổi thành công

    Note over GV,Cookie: ── Đăng xuất ──
    GV->>Page: POST /api/auth/logout
    Page->>API: logout/route.ts → POST()
    API->>Cookie: cookies.set(SESSION_COOKIE_NAME, "", maxAge=0)
    Page->>GV: router.push("/auth/dangnhap")
```

### Bảng thao tác

| Thao tác | Được phép? |
|----------|------------|
| Đăng nhập | Có |
| Đăng xuất | Có |
| Quên / đặt lại MK qua email | Có |
| Đổi MK khi đã login | Có |
| Đăng ký qua `/auth/dangky` | Không |

---

## 3. Sinh viên

Luồng **giống Giảng viên** hoàn toàn. Chỉ khác:
- `role = "sinhvien"`
- Trang nhà: `ROLE_HOME["sinhvien"] = "/sinhvien/dashboard"`
- Middleware bảo vệ prefix `/sinhvien/*`

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as app/auth/*/page.tsx
    participant MW as middleware.ts → middleware()
    participant API as app/api/auth/*/route.ts
    participant Lib as lib/auth/
    participant DB as prisma.user.*
    participant Mail as lib/mail-password-reset.ts<br/>sendPasswordResetEmail()
    participant Cookie

    Note over SV,Cookie: ── Đăng nhập ──
    SV->>Page: dangnhap/page.tsx → LoginPage<br/>fetch POST /api/auth/login
    Page->>API: login/route.ts → POST()
    API->>Lib: identifier.ts → resolveLoginEmail(email)
    API->>DB: prisma.user.findUnique({ where: { email } })
    API->>Lib: password.ts → verifyPassword() [bcryptjs]
    API->>Lib: jwt.ts → signSession({ id, role:"sinhvien" }) [jose.SignJWT]
    API->>Cookie: Set SESSION_COOKIE_NAME = JWT
    API-->>Page: 200 { home: "/sinhvien/dashboard" }
    Page->>SV: router.push("/sinhvien/dashboard")

    Note over SV,Cookie: ── Middleware bảo vệ route ──
    SV->>MW: Request đến /sinhvien/*
    MW->>MW: jose.jwtVerify(cookie, getSecretKey()) → { role:"sinhvien" }
    alt Role khớp
        MW-->>SV: NextResponse.next()
    else Sai role / chưa login
        MW-->>SV: redirect(ROLE_HOME[role] hoặc /auth/dangnhap)
    end

    Note over SV,Cookie: ── Quên mật khẩu ──
    SV->>Page: quenmatkhau/page.tsx<br/>fetch POST /api/auth/forgot-password
    Page->>API: forgot-password/route.ts → POST()
    API->>DB: prisma.user.findUnique()
    API->>Lib: jwt.ts → signPasswordResetToken() [jose 15 phút]
    API->>Mail: sendPasswordResetEmail() → sendMail() [nodemailer]
    API-->>SV: Kiểm tra hộp thư

    Note over SV,Cookie: ── Đặt lại mật khẩu ──
    SV->>Page: datlaimatkhau/page.tsx?token=...<br/>fetch POST /api/auth/reset-password
    Page->>API: reset-password/route.ts → POST() { token, newPassword }
    API->>Lib: jwt.ts → verifyPasswordResetToken(token)
    alt Hợp lệ
        API->>Lib: password.ts → hashPassword()
        API->>DB: prisma.user.update({ data: { passwordHash } })
        Page->>SV: redirect /auth/dangnhap
    else Hết hạn
        Page->>SV: Thông báo lỗi
    end

    Note over SV,Cookie: ── Đổi mật khẩu (đã login) ──
    SV->>Page: doimatkhau/page.tsx<br/>fetch POST /api/auth/change-password
    Page->>API: change-password/route.ts → POST()
    API->>Lib: jwt.ts → verifySession(cookie)
    API->>Lib: password.ts → verifyPassword() + hashPassword()
    API->>DB: prisma.user.update()
    API-->>SV: 200

    Note over SV,Cookie: ── Đăng xuất ──
    SV->>API: POST /api/auth/logout → logout/route.ts
    API->>Cookie: Set SESSION_COOKIE_NAME="" maxAge=0
    Page->>SV: redirect /auth/dangnhap
```

### Bảng thao tác

| Thao tác | Được phép? |
|----------|------------|
| Đăng nhập | Có |
| Đăng xuất | Có |
| Quên / đặt lại MK qua email | Có |
| Đổi MK khi đã login | Có |
| Đăng ký qua `/auth/dangky` | Không |

---

## 4. Doanh nghiệp

Doanh nghiệp có **hai giai đoạn**: `PENDING` → `APPROVED`. Khả năng đăng nhập phụ thuộc `enterpriseStatus`.

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    actor AdminUser as Admin
    participant Page as app/auth/*/page.tsx<br/>app/auth/dangky/page.tsx
    participant MW as middleware.ts → middleware()
    participant API as app/api/auth/*/route.ts
    participant Lib as lib/auth/ + lib/enterprise-register-validate.ts
    participant DB as prisma.user.* + prisma.enterpriseProfile.*
    participant Mail as lib/mail.ts → sendMail()<br/>lib/mail-enterprise.ts
    participant Cookie

    Note over DN,Cookie: ── Đăng ký tài khoản ──
    DN->>Page: dangky/page.tsx → EnterpriseRegisterPage<br/>fetch POST /api/auth/register-enterprise
    Page->>API: register-enterprise/route.ts → POST()
    API->>Lib: enterprise-register-validate.ts → validateEnterpriseRegisterPayload(body)
    alt Dữ liệu hợp lệ
        API->>Lib: password.ts → hashPassword(password) [bcryptjs]
        API->>DB: prisma.user.create({ role:"doanhnghiep",<br/>enterpriseProfile: { create: { status: PENDING } } })
        API->>Mail: sendMail() [nodemailer] – email tiếp nhận cho DN
        API->>Mail: sendMail() – email thông báo Admin duyệt
        API-->>Page: 200
        Page->>DN: redirect /auth/dangky/cho-phe-duyet
    else Dữ liệu lỗi
        API-->>Page: 400 – thông báo lỗi
    end

    Note over AdminUser,Mail: ── Admin phê duyệt / từ chối (trong /admin/quan-ly-tai-khoan) ──
    AdminUser->>DB: PATCH enterpriseProfile.status = APPROVED / REJECTED
    DB-->>Mail: Trigger sendEnterpriseApprovedEmail() hoặc sendEnterpriseRejectedEmail()<br/>lib/mail-enterprise.ts → sendMail() [nodemailer]
    Mail->>DN: Email thông báo kết quả

    Note over DN,Cookie: ── Đăng nhập (sau khi APPROVED) ──
    DN->>Page: dangnhap/page.tsx → LoginPage<br/>fetch POST /api/auth/login
    Page->>API: login/route.ts → POST()
    API->>Lib: identifier.ts → resolveLoginEmail(email)
    API->>DB: prisma.user.findUnique({ include: { enterpriseProfile: true } })
    API->>Lib: password.ts → verifyPassword() [bcryptjs]
    alt enterpriseStatus = APPROVED + không khóa + đúng MK
        API->>Lib: jwt.ts → signSession({ id, role:"doanhnghiep" }) [jose.SignJWT]
        API->>Cookie: Set SESSION_COOKIE_NAME = JWT
        API-->>Page: 200 { home: "/doanhnghiep/dashboard" }
        Page->>DN: router.push("/doanhnghiep/dashboard")
    else enterpriseStatus = PENDING
        API-->>Page: 403 – chờ phê duyệt, kiểm tra email
    else enterpriseStatus = REJECTED
        API-->>Page: 403 – chưa được duyệt / liên hệ Phòng đào tạo
    else Sai mật khẩu / bị khóa
        API-->>Page: 401/403
    end

    Note over DN,Cookie: ── Middleware bảo vệ route ──
    DN->>MW: Request đến /doanhnghiep/*
    MW->>MW: jose.jwtVerify(cookie, getSecretKey()) → { role:"doanhnghiep" }
    alt Role khớp
        MW-->>DN: NextResponse.next()
    else Chưa login / sai role
        MW-->>DN: redirect(ROLE_HOME[role] hoặc /auth/dangnhap)
    end

    Note over DN,Cookie: ── Quên mật khẩu ──
    DN->>Page: quenmatkhau/page.tsx<br/>fetch POST /api/auth/forgot-password
    Page->>API: forgot-password/route.ts → POST()
    API->>DB: prisma.user.findUnique()
    API->>API: Kiểm tra role ≠ admin + không khóa
    API->>Lib: jwt.ts → signPasswordResetToken() [jose 15 phút]
    API->>Mail: mail-password-reset.ts → sendPasswordResetEmail()<br/>→ sendMail() [nodemailer]
    API-->>DN: 200 – kiểm tra hộp thư

    Note over DN,Cookie: ── Đặt lại mật khẩu ──
    DN->>Page: datlaimatkhau/page.tsx?token=...<br/>fetch POST /api/auth/reset-password
    Page->>API: reset-password/route.ts → POST() { token, newPassword }
    API->>Lib: jwt.ts → verifyPasswordResetToken(token)
    alt Hợp lệ (≤ 15 phút)
        API->>Lib: password.ts → hashPassword()
        API->>DB: prisma.user.update({ data: { passwordHash } })
        Page->>DN: redirect /auth/dangnhap
    else Hết hạn
        Page->>DN: Thông báo lỗi
    end

    Note over DN,Cookie: ── Đổi mật khẩu (đã login) ──
    DN->>Page: doimatkhau/page.tsx<br/>fetch POST /api/auth/change-password
    Page->>API: change-password/route.ts → POST()
    API->>Lib: jwt.ts → verifySession(cookie)
    API->>Lib: password.ts → verifyPassword() + hashPassword()
    API->>DB: prisma.user.update()
    API-->>DN: 200

    Note over DN,Cookie: ── Đăng xuất ──
    DN->>API: POST /api/auth/logout → logout/route.ts
    API->>Cookie: Set SESSION_COOKIE_NAME="" maxAge=0
    Page->>DN: redirect /auth/dangnhap
```

### Bảng thao tác

| Thao tác | Được phép? | Ghi chú |
|----------|------------|---------|
| Đăng ký (`/auth/dangky`) | Có | Tạo tài khoản → `enterpriseStatus: PENDING` |
| Đăng nhập | Có **khi APPROVED** | PENDING/REJECTED → 403 |
| Đăng xuất | Có | Khi đã có phiên |
| Quên / đặt lại MK | Có | Giống GV/SV |
| Đổi MK khi đã login | Có | Có link sidebar |

---

## API auth

| API | Handler | Ý nghĩa |
|-----|---------|---------|
| `POST /api/auth/login` | `login/route.ts → POST()` | Đăng nhập, set cookie `session` |
| `POST /api/auth/logout` | `logout/route.ts → POST()` | Xóa cookie `session` |
| `GET /api/auth/me` | `me/route.ts → GET()` | Phiên hiện tại + `role` + `home` |
| `POST /api/auth/forgot-password` | `forgot-password/route.ts → POST()` | Gửi email đặt lại MK (chặn admin) |
| `POST /api/auth/reset-password` | `reset-password/route.ts → POST()` | Đặt lại MK bằng JWT token (chặn admin) |
| `POST /api/auth/change-password` | `change-password/route.ts → POST()` | Đổi MK có phiên (chặn admin) |
| `POST /api/auth/register-enterprise` | `register-enterprise/route.ts → POST()` | Đăng ký DN → chờ duyệt |
