# Luồng xác thực (Auth)
---

## Bảng tổng quan

| Vai trò | Sau đăng nhập thành công (mặc định) | Quên & đặt lại MK qua email | Đổi MK (`/auth/doimatkhau`) | Đăng ký tài khoản qua form |
|--------|--------------------------------------|-----------------------------|-----------------------------|----------------------------|
| **Admin** | `/admin/dashboard` | Không | Không (middleware + API chặn) | Không (tài khoản do seed/quản trị) |
| **Giảng viên** | `/giangvien/dashboard` | Có | Có | Không trong flow auth công khai |
| **Sinh viên** | `/sinhvien/dashboard` | Có | Có | Không trong flow auth công khai |
| **Doanh nghiệp** | `/doanhnghiep/dashboard` | Có (khi đã được duyệt) | Có (khi đã được duyệt) | Có — `/auth/dangky` → chờ phê duyệt |

Cookie phiên: `session` (JWT ~7 ngày). Chi tiết kỹ thuật: cuối tài liệu.

---

## 1. Admin

### 1.1. Ai là admin trong hệ thống?

User có `role = admin` trong CSDL (thường tạo bằng seed / quản trị DB), không có form “đăng ký admin” trên web.

### 1.2. Luồng đăng nhập

1. Mở `/auth/dangnhap`.
2. **Tên đăng nhập:** gõ `admin` **hoặc** email `admin@utc.edu.vn` (hệ thống map `admin` → `admin@utc.edu.vn`).
3. Nhập mật khẩu → gửi `POST /api/auth/login`.
4. Nếu đúng và tài khoản không khóa (`isLocked`):
   - Server set cookie `session`.
   - Trình duyệt chuyển tới **`/admin/dashboard`** (hoặc `?next=...` nếu URL login có `next` hợp lệ).
5. Nếu sai: thông báo lỗi tương ứng (không tồn tại, sai mật khẩu, khóa, …).

**Trên form đăng nhập:** khi hệ thống coi bạn đang nhập admin (`admin@utc.edu.vn`), link **“Quên mật khẩu?” bị ẩn** — vì admin không dùng luồng quên mật khẩu qua email.

### 1.3. Sau khi đã đăng nhập — điều hướng thường gặp

- Vào **`/`** → middleware đọc cookie → **redirect thẳng** tới `/admin/dashboard`.
- Vào **`/auth/dangnhap`**, `/auth/quenmatkhau`, `/auth/dangky`, … (route auth dành khách) → **redirect** về `/admin/dashboard` (không cho “lạc” lại form khách khi đã có phiên).
- Vào **`/auth/doimatkhau`** → **redirect** về `/admin/dashboard` (admin không đổi mật khẩu qua cổng này).
- Vào **`/giangvien/*`**, `/sinhvien/*`, `/doanhnghiep/*`** → sai role → **redirect** về `/admin/dashboard`.

### 1.4. Thao tác auth admin **được phép / không**

| Thao tác | Được phép? | Ghi chú |
|----------|------------|---------|
| Đăng nhập | Có | `admin` hoặc `admin@utc.edu.vn` |
| Đăng xuất | Có | Sidebar → gọi `POST /api/auth/logout` → về `/auth/dangnhap` |
| Quên mật khẩu / email reset | **Không** | API `forgot-password` trả 403 |
| Đặt lại mật khẩu bằng link email | **Không** | API `reset-password` trả 403 |
| Đổi mật khẩu trên web | **Không** | API `change-password` trả 403; không có mục sidebar |
| Đăng ký tài khoản mới (form) | **Không** | Không nằm trong luồng auth công khai cho admin |

---

## 2. Giảng viên

### 2.1. Luồng đăng nhập

1. Mở `/auth/dangnhap`.
2. Nhập **email** đã có trong hệ thống + mật khẩu.
3. `POST /api/auth/login` → nếu hợp lệ → cookie `session` → chuyển tới **`/giangvien/dashboard`** (hoặc `next` nếu có).

### 2.2. Sau khi đã đăng nhập

- Vào **`/`** → về **`/giangvien/dashboard`**.
- Vào các URL **`/auth/...`** (trừ `/auth/doimatkhau`) → **redirect** về **`/giangvien/dashboard`**.
- Vào **`/auth/doimatkhau`** → **được phép** (cần đã đăng nhập) → đổi mật khẩu.
- Vào **`/admin/*`** hoặc prefix role khác → **redirect** về **`/giangvien/dashboard`**.

### 2.3. Luồng quên & đặt lại mật khẩu (khi chưa đăng nhập hoặc mất mật khẩu)

1. `/auth/quenmatkhau` → nhập email → `POST /api/auth/forgot-password`.
2. Nếu email thuộc tài khoản giảng viên (và không khóa): nhận email có link  
   `/auth/datlaimatkhau?email=...&token=...` (token JWT, **hết hạn 15 phút**).
3. Nhập mật khẩu mới + xác nhận → `POST /api/auth/reset-password`.
4. Thành công → thường chuyển về **`/auth/dangnhap`** để đăng nhập lại.

### 2.4. Luồng đổi mật khẩu (khi đã đăng nhập)

1. Từ sidebar: **Đổi mật khẩu** → `/auth/doimatkhau`.
2. Nhập mật khẩu hiện tại, mật khẩu mới, xác nhận → `POST /api/auth/change-password`.

### 2.5. Bảng thao tác auth

| Thao tác | Được phép? |
|----------|------------|
| Đăng nhập | Có |
| Đăng xuất | Có |
| Quên / đặt lại MK qua email | Có |
| Đổi MK khi đã login | Có |
| Đăng ký qua `/auth/dangky` | Không (form đó dành doanh nghiệp) |

---

## 3. Sinh viên

Luồng **giống giảng viên**, chỉ khác **trang nhà** và **vùng được phép**.

### 3.1. Đăng nhập → sau thành công

- Mặc định: **`/sinhvien/dashboard`**.
- Vào **`/`** hoặc hầu hết `/auth/*` (guest) → về **`/sinhvien/dashboard`**.
- **`/auth/doimatkhau`** → được dùng khi đã đăng nhập.
- Prefix **`/sinhvien/*`** → đúng role mới vào được; prefix role khác → đẩy về **`/sinhvien/dashboard`**.

### 3.2. Quên / đặt lại / đổi mật khẩu

- Cùng các bước như mục **2.3** và **2.4** (email → link `datlaimatkhau` → `reset-password`; hoặc `doimatkhau` + `change-password`).

### 3.3. Bảng thao tác auth

Giống bảng **2.5**; đăng ký công khai qua `/auth/dangky` **không** dành cho sinh viên trong thiết kế hiện tại.

---

## 4. Doanh nghiệp

Doanh nghiệp có **hai “giai đoạn”**: chưa được phê duyệt → đã được phê duyệt. Auth phụ thuộc `enterpriseStatus`.

### 4.1. Luồng “chưa có tài khoản” — đăng ký

1. Mở **`/auth/dangky`**, điền form → `POST /api/auth/register-enterprise`.
2. Hệ thống tạo user `role = doanhnghiep`, trạng thái **chờ phê duyệt**; gửi email tiếp nhận (nếu cấu hình mail OK).
3. Giao diện chuyển tới **`/auth/dangky/cho-phe-duyet`**.
4. **Chưa đăng nhập được** cho tới khi admin phê duyệt (trạng thái phù hợp trong CSDL).

### 4.2. Luồng đăng nhập (sau khi được phê duyệt)

1. `/auth/dangnhap` → email doanh nghiệp + mật khẩu.
2. `POST /api/auth/login`:
   - Nếu vẫn **PENDING** → **403**, báo chờ phê duyệt, xem email.
   - Nếu **REJECTED** → **403**, báo chưa được duyệt / xem email / liên hệ Phòng đào tạo.
   - Nếu đã **được duyệt** (và không khóa, đúng mật khẩu) → cookie `session` → **`/doanhnghiep/dashboard`** (hoặc `next`).

### 4.3. Sau khi đã đăng nhập (doanh nghiệp đã duyệt)

- **`/`** hoặc guest `/auth/*` → về **`/doanhnghiep/dashboard`**.
- **`/auth/doimatkhau`** → đổi mật khẩu (giống GV/SV).
- Prefix **`/doanhnghiep/*`** hợp lệ; prefix role khác → về **`/doanhnghiep/dashboard`**.

### 4.4. Quên / đặt lại / đổi mật khẩu

- **Giống GV/SV** (cùng API), miễn là user **không** phải admin và tài khoản **không khóa**.
- Thực tế: doanh nghiệp thường dùng sau khi đã duyệt; nếu tài khoản pending/rejected, đăng nhập đã fail nên luồng “đổi MK khi đã login” chỉ áp dụng khi đã vào được dashboard.

### 4.5. Bảng thao tác auth

| Thao tác | Được phép? | Ghi chú |
|----------|------------|---------|
| Đăng ký (`/auth/dangky`) | Có | Tạo tài khoản chờ duyệt |
| Đăng nhập | Có **khi đã duyệt** | Pending / rejected → không vào được |
| Đăng xuất | Có | Khi đã có phiên |
| Quên / đặt lại MK | Có | Không áp dụng cho admin; DN dùng giống user thường |
| Đổi MK | Có | Có link sidebar khi đã đăng nhập |

---


### API auth 

| API | Ý nghĩa |
|-----|---------|
| `POST /api/auth/login` | Đăng nhập, set cookie |
| `POST /api/auth/logout` | Xóa cookie |
| `GET /api/auth/me` | Phiên hiện tại + `role` + `home` |
| `POST /api/auth/forgot-password` | Gửi email đặt lại MK (chặn admin) |
| `POST /api/auth/reset-password` | Đặt lại MK bằng token (chặn admin) |
| `POST /api/auth/change-password` | Đổi MK có phiên (chặn admin) |
| `POST /api/auth/register-enterprise` | Đăng ký DN chờ duyệt |

---

