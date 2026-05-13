# Auth flow (chi tiết theo file/hàm/request)

## 0) Session/JWT & cookie

- **Cookie name**: `SESSION_COOKIE_NAME = "session"` (`lib/constants/auth/patterns.ts`)
- **Ký JWT session**: `signSession()` (`lib/auth/jwt.ts`)
  - Payload: `{ role, email }`, subject \(sub\) = `user.id`
  - Exp: `"7d"`
- **Verify JWT session**: `verifySession()` (`lib/auth/jwt.ts`) → `{ sub, role, email }`

---

## 1) Đăng nhập (SV/GV/DN/Admin) — `POST /api/auth/login`

### 1.1 UI gọi API

- File: `app/auth/dangnhap/page.tsx`
- `handleSubmit()`:
  - `fetch("/api/auth/login", { method: "POST", body: { identifier, password } })`
  - Success: redirect `router.replace(dest)` với:
    - `next` query param (nếu có, hợp lệ) **ưu tiên**
    - fallback `data.redirectPath`
    - fallback `"/"`
  - Helpers:
    - validate form: `validateLoginForm()` (`lib/utils/auth/login.ts`)
    - map error: `mapLoginApiErrorToForm()` (`lib/utils/auth/login.ts`)

### 1.2 API xử lý

- File: `app/api/auth/login/route.ts`
- Hàm: `POST(request)`

**Input JSON** (`LoginRequestBody`):
- `identifier`: string (email hoặc `"admin"`)
- `password`: string

**Luồng xử lý (theo thứ tự code)**
- Validate empty:
  - `400` → `{ success:false, message:"Vui lòng nhập đầy đủ email và mật khẩu." }`
- Chuẩn hoá email:
  - `resolveLoginEmail(identifier)` (`lib/auth/identifier.ts`)
  - `"admin"` → `"admin@utc.edu.vn"`
  - Không đúng pattern → `400` code `INVALID_EMAIL`
- DB:
  - `prisma.user.findUnique({ where: { email } })`
  - Not found → `404` code `NOT_FOUND` + `suggestRegister:true`
- Locked:
  - `user.isLocked` → `423` code `LOCKED`
- Chặn doanh nghiệp chưa duyệt:
  - `user.role === doanhnghiep`:
    - `enterpriseStatus PENDING/null` → `403` code `ENTERPRISE_PENDING`
    - `enterpriseStatus REJECTED` → `403` code `ENTERPRISE_REJECTED`
- Verify password:
  - `verifyPassword(password, user.passwordHash)` (`lib/auth/password.ts`)
  - Fail → `401` code `WRONG_PASSWORD`
- Tạo session:
  - `token = signSession({ sub:user.id, role:user.role, email:user.email })` (`lib/auth/jwt.ts`)
  - `redirectPath = ROLE_HOME[user.role]` (`lib/constants/routing.ts`)
- Response success:
  - JSON:
    - `{ success:true, message:"Đăng nhập thành công.", user:{ identifier, role }, redirectPath }`
  - Set cookie:
    - `res.cookies.set("session", token, { httpOnly:true, sameSite:"lax", path:"/", secure: prod, maxAge: 7d })`

---

## 2) Đăng xuất — `POST /api/auth/logout`

- File: `app/api/auth/logout/route.ts`
- Hàm: `POST()`
- Response:
  - JSON: `{ success:true }`
  - Clear cookie `session` (`maxAge: 0`)

---

## 3) Check session (client polling) — `GET /api/auth/me`

- File: `app/api/auth/me/route.ts`
- Hàm: `GET()`
- Logic:
  - Read cookie `session`
  - `verifySession(token)` (`lib/auth/jwt.ts`)
- Response:
  - No cookie/invalid token → `401` `{ authenticated:false }`
  - Ok → `{ authenticated:true, role, home: ROLE_HOME[role] ?? "/" }`

---

## 4) Đăng ký doanh nghiệp (kèm upload logo + gửi email tiếp nhận) — `POST /api/auth/register-enterprise`

### 4.1 UI gọi API (kèm base64 file)

- File: `app/auth/dangky/page.tsx`
- `handleSubmit()`:
  - Đọc file:
    - `readFileAsBase64Payload(businessLicense)`
    - `readFileAsBase64Payload(companyLogo)`
  - `fetch("/api/auth/register-enterprise", { method:"POST", body: { ...fields, businessLicense*, companyLogo* } })`
  - Error:
    - API trả `{ field, message }` → set vào form
  - Success:
    - Toast `"Đăng ký thành công."`, UI redirect flow nội bộ (đợi user quay về login)

### 4.2 API xử lý + Cloudinary + tạo user + gửi mail

- File: `app/api/auth/register-enterprise/route.ts`
- Hàm: `POST(request)`

**Input JSON** (`EnterpriseRegisterPayload`):
- Thông tin DN: `companyName, taxCode, businessFields, website, representativeName, representativeTitle`
- Địa chỉ: `province, ward, provinceCode, wardCode, addressDetail`
- Liên hệ: `phone, email`
- File giấy phép: `businessLicenseName, businessLicenseMime, businessLicenseBase64`
- File logo: `companyLogoName, companyLogoMime, companyLogoBase64`

**Validate + build data tạo user**
- `validateEnterpriseRegisterPayload(body)` (`lib/enterprise-register-validate.ts`)
  - Check pattern/required + dup email/phone trong DB
  - Build:
    - `passwordHash = hashPassword(taxCode)` (`lib/auth/password.ts`) (mật khẩu tạm thời = MST)
    - `role = "doanhnghiep"`, `enterpriseStatus = "PENDING"`
    - `enterpriseMeta` chứa address + file payload base64/mime/byteLength + website + đại diện...
  - Nếu fail:
    - Response: `status = error.status`
    - JSON: `{ success:false, field:error.field, message:error.message }`

**Upload logo lên Cloudinary (server)**
- Trong `register-enterprise/route.ts`:
  - Đọc `companyLogo*` từ `enterpriseMeta`
  - `uploadEnterpriseLogoBytesToCloudinary()` (`lib/storage/cloudinary.ts`)
  - Ghi `enterpriseMeta.companyLogoPublicId = toCloudinaryRef(uploaded.publicId)`
  - Xóa `companyLogoBase64/companyLogoByteLength` khỏi meta

**Tạo user**
- `prisma.user.create({ data: nextUserCreate })`
- Lỗi trùng/constraint → `409` `{ success:false, message:"Không thể tạo tài khoản..." }`

**Gửi email “tiếp nhận đăng ký”**
- Build URL public:
  - `appUrl = getPublicAppUrl()` (`lib/mail-enterprise.ts`)
  - `loginUrl = ${appUrl}/auth/dangnhap`
- Gửi:
  - `sendMail(email, subject, text, html)` (`lib/mail.ts`)
  - HTML dùng: `buildMailShell()` + `mailLetterClosingHtml()` (`lib/mail-layout.ts`)
  - Fail gửi mail: chỉ `console.error`, **không fail request**

**Response success**
- `200`:
  - `{ success:true, message:"Đăng ký thành công. Tài khoản đang chờ phê duyệt.", redirectPath:"/auth/dangky" }`

### 4.3 Email duyệt / từ chối DN (trigger bởi admin)

- API admin đổi trạng thái:
  - File: `app/api/admin/enterprises/[id]/status/route.ts`
  - `POST()` với body `{ action:"approve" | "reject", reasons?: string[] }`
  - Approve:
    - `prisma.user.update({ enterpriseStatus: APPROVED, enterpriseMeta.approvedAt/approvedByAdminId })`
    - `sendEnterpriseApprovedEmail()` (`lib/mail-enterprise.ts`)
  - Reject:
    - `sendEnterpriseRejectedEmail()` (`lib/mail-enterprise.ts`)
    - `deleteEnterpriseUserCascade()` (xóa tài khoản DN)

---

## 5) Quên mật khẩu (GV/SV/DN; chặn admin) — `POST /api/auth/forgot-password`

### 5.1 UI gọi API

- File: `app/auth/quenmatkhau/page.tsx`
- `fetch("/api/auth/forgot-password", { body:{ email } })`

### 5.2 API xử lý + gửi mail token 15 phút

- File: `app/api/auth/forgot-password/route.ts`
- Hàm: `POST(request)`

**Luồng xử lý**
- Validate email empty/format:
  - `400` code `EMPTY_EMAIL` / `INVALID_FORMAT`
- `prisma.user.findUnique({ where:{ email } })`
  - Not found → `404` code `NOT_FOUND`
  - Locked → `423` code `LOCKED`
  - Admin → `403` code `NOT_ALLOWED`
- Token:
  - `resetToken = signPasswordResetToken(email)` (`lib/auth/jwt.ts`) exp `"15m"`
- URL reset:
  - `resetUrl = ${getPublicAppUrl()}/auth/datlaimatkhau?email=...&token=...`
- Gửi mail:
  - `sendPasswordResetEmail()` (`lib/mail-password-reset.ts`)
    - Render React Email: `emails/password-reset-email.tsx`
    - Thực gửi SMTP: `sendMail()` (`lib/mail.ts`)
- Success:
  - `200` `{ success:true, message:"Đã gửi liên kết..." }`

---

## 6) Đặt lại mật khẩu (qua email link) — `POST /api/auth/reset-password`

### 6.1 UI gọi API

- File: `app/auth/datlaimatkhau/page.tsx`
- Lấy query:
  - `email = searchParams.get("email")`
  - `token = searchParams.get("token")`
- `fetch("/api/auth/reset-password", { body:{ email, token, newPassword, confirmPassword } })`

### 6.2 API xử lý

- File: `app/api/auth/reset-password/route.ts`
- Hàm: `POST(request)`

**Luồng xử lý**
- Missing required → `400` code `REQUIRED`
- Verify token:
  - `verifyPasswordResetToken(token)` (`lib/auth/jwt.ts`)
  - Fail → `400` code `INVALID_TOKEN`
- Token/email mismatch → `400` code `INVALID_TOKEN`
- DB:
  - user not found / locked → `400` code `INVALID_ACCOUNT`
  - admin → `403` code `NOT_ALLOWED`
- Validate password:
  - `AUTH_STRONG_PASSWORD_PATTERN` (`lib/constants/auth/patterns.ts`)
  - Weak → `400` code `WEAK_PASSWORD`
  - Confirm mismatch → `400` code `CONFIRM_NOT_MATCH`
- Update:
  - `prisma.user.update({ data:{ passwordHash: hashPassword(newPassword) } })`
- Success:
  - `200` `{ success:true, message:"Đặt lại mật khẩu thành công.", redirectPath:"/auth/dangnhap" }`

---

## 7) Đổi mật khẩu (đã login; chặn admin) — `POST /api/auth/change-password`

- File: `app/api/auth/change-password/route.ts`
- Hàm: `POST(request)`
- Auth:
  - Read cookie `session` → `verifySession()` để lấy `sub`
  - No cookie / invalid token → `401` code `UNAUTHORIZED`
- Validate + verify current password:
  - Wrong current → `400` code `WRONG_CURRENT`
  - Weak new → `400` code `WEAK_PASSWORD`
  - Confirm mismatch → `400` code `CONFIRM_NOT_MATCH`
- Update DB:
  - `prisma.user.update({ where:{ id: sub }, data:{ passwordHash: hashPassword(newPassword) } })`
- Success:
  - `200` `{ success:true, message:"Đổi mật khẩu thành công." }`

---

## 8) Route protection/redirect theo role (frontend navigation)

- File: `middleware.ts`
- Cơ chế:
  - Route theo prefix `/admin|/giangvien|/sinhvien|/doanhnghiep` nằm trong `ROLE_PROTECTED_ROUTE_PREFIXES` (`lib/constants/auth/guards.ts`)
  - Nếu không có `SECRET` hoặc thiếu/invalid cookie → redirect `/auth/dangnhap?next=...`
  - Nếu role token không khớp prefix → redirect về `ROLE_HOME[role]`
  - Guest routes `/auth/*`:
    - Nếu đã có session hợp lệ → redirect về `ROLE_HOME[role]`

