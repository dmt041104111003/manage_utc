# Module quản lý doanh nghiệp (Admin)

---

## 1. Mục đích

- Xem danh sách tài khoản **vai trò doanh nghiệp** (`User.role = doanhnghiep`).
- Lọc theo tên / mã số thuế và theo **trạng thái phê duyệt** (`EnterpriseStatus`).
- Xem chi tiết hồ sơ (meta đăng ký, file, logo, …).
- **Phê duyệt** / **từ chối** (có gửi email thông báo).
- **Xóa** tài khoản (có giới hạn — xem mục 5).

Luồng đăng ký doanh nghiệp và auth tổng thể: xem [AUTH_FLOW.md](./AUTH_FLOW.md).

---

## 2. Giao diện (UI)

| Thành phần | Mô tả |
|------------|--------|
| Thanh tìm kiếm | Ô “Tên / MST” + chọn trạng thái + nút **Tìm kiếm** (áp dụng `appliedQ`, `appliedStatus`). |
| Bảng | STT, tên DN, MST, trạng thái, thao tác. |
| **Xem** | Modal đọc chi tiết từ `GET /api/admin/enterprises/[id]`. |
| **Xóa** | Một lần `window.confirm` rồi `DELETE` (không dùng modal xác nhận riêng). |
| **Cập nhật trạng thái phê duyệt** | Modal: xem trạng thái hiện tại, **Phê duyệt** / **Từ chối** (từ chối mở bước nhập lý do nhiều dòng). |

**Query URL (tùy chọn):** lần đầu vào trang, nếu có `?status=PENDING|APPROVED|REJECTED` thì đồng bộ vào bộ lọc trạng thái.

**Đồng bộ badge “chờ phê duyệt”:** sau khi phê duyệt / từ chối / xóa thành công, client phát sự kiện tùy chỉnh `admin-pending-enterprises-changed` (hằng `ADMIN_PENDING_ENTERPRISES_CHANGED_EVENT` trong `hooks/useAdminPendingEnterpriseCount.ts`) để layout admin cập nhật số đếm.

---

## 3. API (REST)

Tất cả route dưới đây gọi `getAdminSession()`. Không có phiên admin → **403** `{ message: "Không có quyền truy cập." }`.

### 3.1. `GET /api/admin/enterprises`

**Query:**

| Tham số | Ý nghĩa |
|---------|---------|
| `q` | Tìm theo `companyName` hoặc `taxCode` (không phân biệt hoa thường). |
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `all` (bỏ qua nếu không hợp lệ). |

**Lưu ý lọc PENDING:** gồm cả bản ghi `enterpriseStatus = null` (dữ liệu cũ).

**Response 200:** `{ items: AdminEnterpriseListItem[] }` — mỗi phần tử có `id`, `email`, `companyName`, `taxCode`, `enterpriseStatus` (null được chuẩn hóa thành `PENDING` trong JSON), `createdAt` (ISO string).

### 3.2. `GET /api/admin/enterprises/[id]`

Trả về một user `role = doanhnghiep` với đủ field phục vụ modal chi tiết (gồm `enterpriseMeta`, `representativeTitle`, `phone`, `fullName`, …).

- **404** nếu không tồn tại hoặc không phải doanh nghiệp.

### 3.3. `DELETE /api/admin/enterprises/[id]`

Xóa vĩnh viễn user doanh nghiệp.

- **404** — không tìm thấy hoặc sai role.
- **409** — không cho xóa khi `enterpriseUserHasLinkedData` trả về `true` (hiện tại: tài khoản **đã phê duyệt** `APPROVED` được coi là không xóa được; hoặc user không hợp lệ). Thông điệp: *“Không thể xóa tài khoản đã có dữ liệu liên kết trong hệ thống.”*
- **200** — `{ success: true, message: "Xóa tài khoản thành công." }`

### 3.4. `POST /api/admin/enterprises/[id]/status`

**Body JSON:**

```json
{ "action": "approve" }
```

hoặc

```json
{ "action": "reject", "reasons": ["Lý do 1", "Lý do 2"] }
```

| `action` | Điều kiện | Hành vi |
|----------|-----------|---------|
| `approve` | — | Cập nhật `enterpriseStatus = APPROVED`, ghi `approvedAt`, `approvedByAdminId` vào `enterpriseMeta`, xóa các khóa từ chối cũ trong meta nếu có. Gửi email phê duyệt. Nếu đã APPROVED: 200 với thông báo “đã ở trạng thái…”. |
| `reject` | `reasons` không rỗng | `enterpriseStatus = REJECTED`, ghi `rejectedAt`, `rejectedByAdminId`, `rejectionReasons`. Gửi email từ chối. |

**Lỗi thường gặp:** 400 thiếu `action` / thiếu lý do khi reject; 404 không tìm thấy DN.

Email gửi qua `lib/mail-enterprise.ts`. Nếu SMTP lỗi, API vẫn có thể 200 kèm cảnh báo trong `message` / `mailError`.

---

## 4. Dữ liệu (Prisma)

- Bảng **`User`**: các tài khoản doanh nghiệp có `role = doanhnghiep`, `enterpriseStatus`, `companyName`, `taxCode`, `representativeTitle` (cột, đồng bộ với đăng ký), **`enterpriseMeta`** (JSON: địa chỉ, lĩnh vực, file giấy phép/logo dạng base64, website, …).
- **Chức vụ người đại diện** khi hiển thị admin: ưu tiên cột `representativeTitle`, fallback `enterpriseMeta.representativeTitle` (xem `lib/utils/enterprise-representative.ts`).

---


