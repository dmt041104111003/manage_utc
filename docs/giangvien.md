# Module Giảng viên

---

## Bảng tổng quan

| Module | Route | API chính | Email |
|--------|-------|-----------|-------|
| Tài khoản | `/giangvien/tai-khoan` | `/api/giangvien/me` | Không |
| Quản lý SV phân công | `/giangvien/sinh-vien` | `/api/giangvien/sinh-vien-phan-cong` | Không |
| Quản lý BCTT | `/giangvien/bao-cao` | `/api/giangvien/bao-cao-thuc-tap` | Có (SV) |
| Đổi mật khẩu | `/auth/doimatkhau` | `/api/auth/change-password` | Không |
| Dashboard | `/giangvien/dashboard` | `/api/giangvien/dashboard/overview` | Không |

### Ghi chú hiệu năng
- Popup ở trang `giangvien/bao-cao` đã lazy-load; file BCTT hiển thị qua `/api/files/internship-report/[id]` (inline mặc định), không còn nhúng base64 vào payload list.
- DashboardShell bỏ reload toàn trang sau mutation để thao tác cập nhật trạng thái phản hồi nhanh hơn.
- API search giảng viên dùng chuẩn mới: `msv` ưu tiên `startsWith`; `contains` cho tên chỉ khi `q.length >= 2`.

---

## Tech Stack & cấu trúc thư mục

```
app/
├── giangvien/
│   ├── layout.tsx                                   # GiangvienLayout – bọc DashboardShell role="giangvien"
│   ├── dashboard/
│   │   ├── page.tsx                                 # LecturerDashboardPage
│   │   └── components/
│   │       ├── LecturerDashboardStats.tsx
│   │       └── LecturerDashboardTasks.tsx
│   ├── tai-khoan/
│   │   ├── page.tsx                                 # GiangVienTaiKhoanPage
│   │   └── components/
│   │       ├── GiangVienProfileInfo.tsx             # Thông tin cá nhân (read-only + editable)
│   │       └── GiangVienAccountEditSection.tsx      # Form chỉnh sửa tài khoản
│   ├── sinh-vien/
│   │   ├── page.tsx                                 # GiangvienSinhVienPage
│   │   └── components/
│   │       ├── SinhVienToolbar.tsx
│   │       ├── SinhVienTableSection.tsx
│   │       └── SinhVienViewPopup.tsx
│   └── bao-cao/
│       ├── page.tsx                                 # GiangvienQuanLyBCPage
│       └── components/
│           ├── BaoCaoToolbar.tsx
│           ├── BaoCaoTableSection.tsx
│           ├── BaoCaoViewPopup.tsx
│           ├── BaoCaoUpdatePopup.tsx                # Popup cập nhật trạng thái thực tập
│           └── BaoCaoReviewPopup.tsx                # Popup duyệt/từ chối BCTT
│
├── auth/doimatkhau/
│   ├── page.tsx                                     # ChangePasswordPage
│   └── components/ChangePasswordFormCard.tsx
│
└── api/giangvien/
    ├── me/route.ts                                  # GET, PATCH
    ├── sinh-vien-phan-cong/route.ts                 # GET
    ├── bao-cao-thuc-tap/route.ts                    # GET
    ├── bao-cao-thuc-tap/[id]/route.ts               # PATCH (duyệt/từ chối BCTT)
    ├── bao-cao-thuc-tap/update-internship-status/[id]/route.ts  # PATCH (cập nhật TT thực tập)
    └── dashboard/overview/route.ts                  # GET

lib/
├── constants/
│   ├── giangvien.ts                                 # GIANGVIEN_DASHBOARD_NAV, TOPBAR_TITLE
│   ├── giangvien-dashboard.ts                       # GIANGVIEN_DASHBOARD_OVERVIEW_ENDPOINT
│   ├── giangvien-sinh-vien.ts                       # GIANGVIEN_SINH_VIEN_ENDPOINT, degreeLabel, statusLabel
│   ├── giangvien-bao-cao-thuc-tap.ts                # degreeLabel, pointPattern, validation messages
│   └── giangvien-tai-khoan.ts                       # degreeLabel, genderLabel, PHONE_PATTERN
├── types/
│   ├── giangvien-dashboard.ts                       # LecturerDashboardItem, LecturerDashboardOverviewResponse
│   ├── giangvien-sinh-vien.ts                       # Degree, GuidanceStatus, Gender, InternshipStatus, Row, BatchOption
│   ├── giangvien-bao-cao-thuc-tap.ts                # Degree, InternshipStatus, ReportReviewStatus, Report, Row
│   └── giangvien-tai-khoan.ts                       # Degree, Gender, Province, Ward, GiangVienMe, GiangVienTaiKhoanDraft
└── utils/
    ├── giangvien-dashboard.ts                       # fetchLecturerDashboardOverview, getLecturerDashboardErrorMessage
    ├── giangvien-sinh-vien.ts                       # buildGiangVienSinhVienQueryParams, formatDateVi
    ├── giangvien-bao-cao-thuc-tap.ts                # validateGiangVienBaoCaoApprove, formatDateVi
    └── giangvien-tai-khoan.ts                       # buildDraftFromMe, validateForm, buildPatchPayload
```

---

## 1. Tài khoản (`/giangvien/tai-khoan`)

### Chức năng
- Xem thông tin cá nhân: họ tên, MSV giảng viên, khoa, bậc, giới tính, ngày sinh, địa chỉ, SĐT, email
- Chỉnh sửa: SĐT, địa chỉ thường trú (tỉnh/phường)
- Chọn địa chỉ qua dropdown tỉnh → phường (gọi API VN address)

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as giangvien/tai-khoan/page.tsx<br/>GiangVienTaiKhoanPage
    participant ProfileInfo as GiangVienProfileInfo.tsx
    participant EditSection as GiangVienAccountEditSection.tsx
    participant MeAPI as api/giangvien/me/route.ts
    participant VNAPI as /api/vn-address/*
    participant DB as Prisma

    Note over GV,DB: ── Tải trang ──
    GV->>Page: Mở /giangvien/tai-khoan
    Page->>MeAPI: GET /api/giangvien/me
    MeAPI->>DB: supervisorProfile.findFirst<br/>+ user.findFirst (fullName, email, phone, ...)
    DB-->>MeAPI: { me: GiangVienMe }
    MeAPI-->>Page: { success, me }
    Page->>ProfileInfo: Props: me (họ tên, MSV GV, khoa, bậc, giới tính, ngày sinh)

    Page->>VNAPI: GET /api/vn-address/provinces
    VNAPI-->>Page: provinces[]
    Page->>VNAPI: GET /api/vn-address/provinces/{provinceCode}/wards
    VNAPI-->>Page: wards[]

    Note over GV,DB: ── Chỉnh sửa tài khoản ──
    GV->>Page: Nhấn "Chỉnh sửa"
    Page->>EditSection: isEditing = true
    GV->>EditSection: Sửa SĐT + chọn tỉnh/phường
    EditSection->>Page: onChange(field, value)
    alt Thay đổi tỉnh
        Page->>VNAPI: GET /api/vn-address/provinces/{provinceCode}/wards
        VNAPI-->>Page: wards[] mới
    end
    GV->>EditSection: Nhấn "Lưu"
    Page->>Page: validateGiangVienTaiKhoanForm()<br/>lib/utils/giangvien-tai-khoan.ts
    alt Hợp lệ
        Page->>Page: buildGiangVienTaiKhoanPatchPayload()
        Page->>MeAPI: PATCH /api/giangvien/me { phone, provinceCode, wardCode }
        MeAPI->>VNAPI: fetchProvinceList / fetchWardsForProvince<br/>lib/vn-open-api.ts (resolve tên tỉnh/phường)
        MeAPI->>DB: $transaction:<br/>user.update(phone)<br/>supervisorProfile.update(address fields)
        DB-->>MeAPI: OK
        MeAPI-->>Page: { success, message }
        Page->>MeAPI: GET /api/giangvien/me (refresh)
        Page->>GV: Toast thành công, isEditing = false
    else Lỗi validation
        Page->>GV: Hiển thị fieldErrors
    end

    Note over GV,DB: ── Huỷ chỉnh sửa ──
    GV->>Page: Nhấn "Huỷ"
    Page->>Page: buildGiangVienTaiKhoanDraftFromMe(me) – khôi phục
    Page->>GV: isEditing = false
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/giangvien/me` | GET | `supervisorProfile.findFirst` + `user.findFirst` | `{ success, me: GiangVienMe }` |
| `/api/giangvien/me` | PATCH | `$transaction`: `user.update(phone)` + `supervisorProfile.update(address)` | `{ success, message }` hoặc `{ errors }` |

---

## 2. Quản lý sinh viên được phân công (`/giangvien/sinh-vien`)

### Chức năng
- Xem danh sách SV được phân công (theo đợt thực tập): STT, MSV, Họ tên, Khóa, Bậc, Trạng thái hướng dẫn
- Tìm kiếm theo: từ khoá (MSV / Họ tên), dropdown đợt thực tập, dropdown trạng thái hướng dẫn
- Xem chi tiết SV qua `Popup[Xem chi tiết SV]`

### Trạng thái hướng dẫn (`GuidanceStatus`)

| Giá trị | Hiển thị |
|---------|---------|
| `GUIDING` | Đang hướng dẫn |
| `COMPLETED` | Hoàn thành hướng dẫn |

### Nội dung Popup[Xem chi tiết SV]

- **Thông tin cơ bản:** MSV, Họ tên, Lớp, Khoa, Khóa, Bậc, SĐT, Email, Ngày sinh, Giới tính, Địa chỉ thường trú
- **Lịch sử trạng thái thực tập** (từ `internshipStatusHistory`)
- **Lịch sử trạng thái hướng dẫn** (từ `supervisorAssignment.statusHistory`)
- **Nếu đã hoàn thành hướng dẫn + SV `COMPLETED`:** hiển thị ĐQT, KTHP, file BCTT, đánh giá
- **Nếu SV chưa hoàn thành thực tập:** hiển thị text "SV chưa hoàn thành thực tập"

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as giangvien/sinh-vien/page.tsx<br/>GiangvienSinhVienPage
    participant Toolbar as SinhVienToolbar.tsx
    participant Table as SinhVienTableSection.tsx
    participant Popup as SinhVienViewPopup.tsx
    participant API as api/giangvien/sinh-vien-phan-cong/route.ts GET()
    participant DB as Prisma

    Note over GV,DB: ── Tải trang ──
    GV->>Page: Mở /giangvien/sinh-vien
    Page->>API: GET /api/giangvien/sinh-vien-phan-cong
    API->>DB: supervisorProfile.findFirst (xác định GV)<br/>supervisorAssignment.findMany (đợt thực tập của GV)<br/>supervisorAssignmentStudent.findMany:<br/>  → studentProfile (msv, lớp, khoa, khóa, bậc, SĐT, email, ngày sinh, giới tính, địa chỉ)<br/>  → internshipStatusHistory[]<br/>  → internshipReport (id + metadata + điểm/đánh giá, không trả base64 file)<br/>  → supervisorAssignment.statusHistory<br/>  → supervisorAssignment.internshipBatch
    DB-->>API: nested data
    API-->>Page: { success, items[], batches[] }
    Page->>Toolbar: batches[] cho dropdown đợt thực tập
    Page->>Table: items[] danh sách SV

    Note over GV,DB: ── Tìm kiếm ──
    GV->>Toolbar: Nhập từ khoá + chọn bộ lọc → "Tìm kiếm"
    Toolbar->>Page: onSearch({ q, batchId, guidanceStatus })
    Page->>API: GET /api/giangvien/sinh-vien-phan-cong<br/>?q=...&batchId=...&status=...
    API->>DB: filterMany với điều kiện tìm kiếm
    DB-->>API: filtered items
    API-->>Page: { success, items[] }
    Page->>Table: Re-render danh sách

    Note over GV,DB: ── Xem chi tiết SV ──
    GV->>Table: Nhấn "Xem chi tiết" trên 1 dòng
    Table->>Page: setViewTarget(row)
    Page->>Popup: viewTarget = row → mở popup
    Popup->>GV: Hiển thị thông tin chi tiết SV:<br/>· Thông tin cơ bản<br/>· Lịch sử TT thực tập<br/>· Lịch sử TT hướng dẫn<br/>· Kết quả (nếu COMPLETED)<br/>· Text "chưa HT" (nếu không COMPLETED)
    GV->>Popup: Nhấn "Đóng"
    Popup->>Page: setViewTarget(null)
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/giangvien/sinh-vien-phan-cong` | GET | `supervisorProfile.findFirst` + `supervisorAssignment.findMany` + `supervisorAssignmentStudent.findMany` (nested: `studentProfile`, `internshipStatusHistory`, `internshipReport`, `supervisorAssignment.statusHistory + internshipBatch`) | `{ success, items[], batches[] }` |

**Query params:**

| Param | Mô tả |
|-------|-------|
| `q` | Tìm theo MSV hoặc họ tên |
| `batchId` | Lọc theo đợt thực tập |
| `status` | Lọc theo trạng thái hướng dẫn (`GUIDING` / `COMPLETED`) |

---

## 3. Quản lý BCTT (`/giangvien/bao-cao`)

### Chức năng
- Xem danh sách SV được phân công: STT, MSV, Họ tên, Khóa, Bậc, Trạng thái thực tập
- Tìm kiếm theo: từ khoá (MSV/Họ tên), dropdown Bậc, dropdown Trạng thái thực tập
- Mỗi dòng có:
  - **"Xem chi tiết"** — luôn hiển thị
  - **"Cập nhật TT thực tập"** — chỉ hiển thị với SV có `internshipStatus = NOT_STARTED`
  - **"Đánh giá BCTT"** — chỉ hiển thị với SV có `internshipStatus = REPORT_SUBMITTED`
- **Popup[Xem chi tiết]:** thông tin SV + trạng thái thực tập hiện tại + dữ liệu điều kiện
- **Popup[Cập nhật TT thực tập]:** chỉ đổi sang `SELF_FINANCED`, gửi email SV
- **Popup[Duyệt BCTT]:** tách rõ 2 chế độ:
  - **Duyệt BCTT:** hiện `Nhận xét/đánh giá`, `Điểm ĐQT`, `Điểm KTHP`
  - **Từ chối BCTT:** chỉ hiện `Lý do từ chối` (bắt buộc)
  - Nút hành động popup: `Xác nhận` + `Hủy`

### Nội dung Popup[Xem chi tiết]

| Điều kiện `internshipStatus` | Thêm hiển thị |
|-----------------------------|---------------|
| `DOING` | Tên DN, MST, địa chỉ DN |
| `REPORT_SUBMITTED` | File BCTT |
| `COMPLETED` | File BCTT + ĐQT + KTHP + đánh giá |
| Các trạng thái khác | Chỉ thông tin cơ bản |

### Popup[Duyệt BCTT] — logic

```
Mode = Duyệt:
- Textarea[Nhận xét/đánh giá]: không bắt buộc
- Input[ĐQT]: số 1–10, bắt buộc
- Input[KTHP]: số 1–10, bắt buộc

Mode = Từ chối:
- Textarea[Lý do từ chối]: bắt buộc

Nút submit chung: "Xác nhận"
- Nếu mode Duyệt  -> PATCH action=APPROVE
- Nếu mode Từ chối -> PATCH action=REJECT
```

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as giangvien/bao-cao/page.tsx<br/>GiangvienQuanLyBCPage
    participant Toolbar as BaoCaoToolbar.tsx
    participant Table as BaoCaoTableSection.tsx
    participant ViewPop as BaoCaoViewPopup.tsx
    participant UpdatePop as BaoCaoUpdatePopup.tsx
    participant ReviewPop as BaoCaoReviewPopup.tsx
    participant ListAPI as api/giangvien/bao-cao-thuc-tap/route.ts GET()
    participant UpdateAPI as api/giangvien/bao-cao-thuc-tap/update-internship-status/[id]/route.ts PATCH()
    participant ReviewAPI as api/giangvien/bao-cao-thuc-tap/[id]/route.ts PATCH()
    participant DB as Prisma
    participant Mail as sendMail()

    Note over GV,Mail: ── Tải trang ──
    GV->>Page: Mở /giangvien/bao-cao
    Page->>ListAPI: GET /api/giangvien/bao-cao-thuc-tap
    ListAPI->>DB: supervisorProfile.findFirst<br/>supervisorAssignmentStudent.findMany:<br/>  → studentProfile + internshipReport<br/>  → supervisorAssignment.internshipBatch<br/>jobApplication.findMany (thông tin DN nếu DOING)
    DB-->>ListAPI: rows với ui flags
    ListAPI-->>Page: { success, rows[] }
    Page->>Table: Render danh sách + điều kiện nút

    Note over GV,Mail: ── Tìm kiếm ──
    GV->>Toolbar: Nhập q + chọn degree + chọn status → "Tìm kiếm"
    Toolbar->>Page: onSearch({ q, degree, status })
    Page->>ListAPI: GET ?q=...&degree=...&status=...
    ListAPI-->>Page: rows[] đã lọc

    Note over GV,Mail: ── Xem chi tiết ──
    GV->>Table: Nhấn "Xem chi tiết"
    Table->>Page: setViewTarget(row)
    Page->>ViewPop: viewTarget → mở popup
    ViewPop->>GV: MSV, Họ tên, Lớp, Khoa, Khóa, Bậc, SĐT, Email, Ngày sinh<br/>· DOING → tên DN + MST + địa chỉ<br/>· REPORT_SUBMITTED → file BCTT (mở qua /api/files/internship-report/{id})<br/>· COMPLETED → file BCTT + ĐQT + KTHP + đánh giá
    GV->>ViewPop: Đóng

    Note over GV,Mail: ── Cập nhật trạng thái thực tập (NOT_STARTED → SELF_FINANCED) ──
    GV->>Table: Nhấn "Cập nhật TT thực tập" (chỉ với NOT_STARTED)
    Table->>Page: setUpdateTarget(row)
    Page->>UpdatePop: updateTarget → mở popup
    UpdatePop->>GV: Hiển thị: MSV, Họ tên, Lớp, Khoa, Khóa, Bậc
    GV->>UpdatePop: Xác nhận → "Lưu"
    UpdatePop->>Page: submitUpdate(studentProfileId)
    Page->>UpdateAPI: PATCH /api/giangvien/bao-cao-thuc-tap/update-internship-status/{studentProfileId}<br/>{ nextStatus: "SELF_FINANCED" }
    UpdateAPI->>DB: supervisorProfile.findFirst (xác thực GV)<br/>studentProfile.findFirst (kiểm tra NOT_STARTED + thuộc phân công GV)<br/>supervisorAssignmentStudent.findFirst
    UpdateAPI->>DB: $transaction:<br/>studentProfile.update(internshipStatus=SELF_FINANCED)<br/>internshipStatusHistory.create
    UpdateAPI->>Mail: sendMail → SV (thông báo cập nhật TT thực tập tự túc)
    Note over Mail: Lỗi email không block response
    UpdateAPI-->>Page: { success, message }
    Page->>Page: load() – reload
    Page->>GV: Toast thành công

    Note over GV,Mail: ── Đánh giá BCTT (REPORT_SUBMITTED) ──
    GV->>Table: Nhấn "Đánh giá BCTT" (chỉ với REPORT_SUBMITTED)
    Table->>Page: setReviewTarget(row)
    Page->>ReviewPop: reviewTarget → mở popup
    ReviewPop->>GV: Hiển thị: MSV, Họ tên, Lớp, Khoa, Khóa, Bậc, file BCTT

    alt Duyệt
        GV->>ReviewPop: Chọn "Duyệt BCTT", nhập đánh giá (optional) + ĐQT (1-10) + KTHP (1-10) → "Xác nhận"
        ReviewPop->>Page: submitReview({ action:"approve", evaluation, dqtPoint, kthpPoint })
        Page->>Page: validateGiangVienBaoCaoApprove()<br/>lib/utils/giangvien-bao-cao-thuc-tap.ts
        Page->>ReviewAPI: PATCH /api/giangvien/bao-cao-thuc-tap/{reportId}<br/>{ action:"approve", evaluation, dqtPoint, kthpPoint }
        ReviewAPI->>DB: internshipReport.findFirst + supervisorAssignmentStudent.findFirst<br/>studentProfile.findFirst + jobApplication.findFirst
        ReviewAPI->>DB: $transaction:<br/>internshipReport.update(reviewStatus=APPROVED, dqtPoint, kthpPoint, evaluation)<br/>studentProfile.update(internshipStatus=REPORT_APPROVED)<br/>internshipStatusHistory.create
        ReviewAPI->>Mail: sendMail → SV (duyệt BCTT + điểm + gửi Phòng ĐT)
        ReviewAPI-->>Page: { success, message }
        Page->>GV: Toast "Đã duyệt BCTT"
    else Từ chối
        GV->>ReviewPop: Chọn "Từ chối BCTT", nhập lý do từ chối (bắt buộc) → "Xác nhận"
        ReviewPop->>Page: submitReview({ action:"reject", rejectReason })
        Page->>ReviewAPI: PATCH /api/giangvien/bao-cao-thuc-tap/{reportId}<br/>{ action:"reject", rejectReason }
        ReviewAPI->>DB: $transaction:<br/>internshipReport.update(reviewStatus=REJECTED, rejectReason)<br/>studentProfile.update(internshipStatus=REPORT_REJECTED)<br/>internshipStatusHistory.create
        ReviewAPI->>Mail: sendMail → SV (từ chối BCTT + lý do)
        ReviewAPI-->>Page: { success, message }
        Page->>GV: Toast "Đã từ chối BCTT"
    end
    Page->>Page: load() – reload danh sách
```

### API chi tiết

| Route | Method | Body | Prisma | Email |
|-------|--------|------|--------|-------|
| `/api/giangvien/bao-cao-thuc-tap` | GET | `?q, degree, status` | `supervisorProfile.findFirst` + `supervisorAssignmentStudent.findMany` (nested: `studentProfile`, `internshipReport`, `internshipBatch`) + `jobApplication.findMany` | Không |
| `/api/files/internship-report/[id]` | GET | `?download=1` (optional) | `internshipReport.findFirst` + check quyền (`admin/giangvien/sinhvien`) + proxy Cloudinary/base64 fallback | Không |
| `/api/giangvien/bao-cao-thuc-tap/update-internship-status/[id]` | PATCH | `{ nextStatus }` | `supervisorProfile.findFirst` + `studentProfile.findFirst` + `supervisorAssignmentStudent.findFirst` + `$transaction`: `studentProfile.update` + `internshipStatusHistory.create` | SV |
| `/api/giangvien/bao-cao-thuc-tap/[id]` | PATCH | `{ action, evaluation?, dqtPoint?, kthpPoint?, rejectReason? }` | `internshipReport.findFirst` + `supervisorAssignmentStudent.findFirst` + `studentProfile.findFirst` + `jobApplication.findFirst` + `$transaction`: `internshipReport.update` + `studentProfile.update` + `internshipStatusHistory.create` | SV |

### Email gửi đi

| Sự kiện | API | Người nhận | Nội dung |
|---------|-----|-----------|---------|
| Cập nhật TT thực tập tự túc | `update-internship-status/[id]` PATCH | SV | Thông báo trạng thái thực tập đã được cập nhật thành "Thực tập tự túc" |
| Duyệt BCTT | `bao-cao-thuc-tap/[id]` PATCH (approve) | SV | BCTT đã được duyệt, điểm ĐQT/KTHP, thông báo gửi Phòng Đào tạo |
| Từ chối BCTT | `bao-cao-thuc-tap/[id]` PATCH (reject) | SV | Lý do từ chối BCTT, hướng dẫn nộp lại |

---

## 4. Đổi mật khẩu (`/auth/doimatkhau`)

### Chức năng
- Đổi mật khẩu khi đã đăng nhập
- Yêu cầu nhập mật khẩu hiện tại để xác thực

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as auth/doimatkhau/page.tsx<br/>ChangePasswordPage
    participant Card as ChangePasswordFormCard.tsx
    participant MeAPI as api/auth/me/route.ts GET()
    participant ChangePwdAPI as api/auth/change-password/route.ts POST()
    participant Lib as lib/auth/
    participant DB as Prisma

    Note over GV,DB: ── Tải trang ──
    GV->>Page: Mở /auth/doimatkhau (từ sidebar)
    Page->>MeAPI: GET /api/auth/me
    MeAPI->>MeAPI: verifySession(cookies) [lib/auth/jwt.ts]
    MeAPI-->>Page: { authenticated, role:"giangvien", home:"/giangvien/dashboard" }
    Page->>Card: Render form + link "Quay lại bảng điều khiển"

    Note over GV,DB: ── Đổi mật khẩu ──
    GV->>Card: Nhập MK hiện tại + MK mới + xác nhận MK mới
    Card->>Page: handleSubmit(form)
    Page->>Page: validateChangePasswordForm()<br/>lib/utils/auth/change-password.ts
    alt Validation thành công
        Page->>ChangePwdAPI: POST /api/auth/change-password<br/>{ currentPassword, newPassword, confirmPassword }
        ChangePwdAPI->>ChangePwdAPI: verifySession(cookie) [lib/auth/jwt.ts]
        ChangePwdAPI->>ChangePwdAPI: Kiểm tra role ≠ admin → 403 nếu admin
        ChangePwdAPI->>DB: prisma.user.findUnique({ where: { id } })
        ChangePwdAPI->>Lib: password.ts → verifyPassword(currentPwd, hash) [bcryptjs.compare]
        alt Mật khẩu hiện tại đúng
            ChangePwdAPI->>Lib: password.ts → hashPassword(newPwd) [bcryptjs.hash]
            ChangePwdAPI->>DB: prisma.user.update({ data: { passwordHash } })
            ChangePwdAPI-->>Page: 200 { success, message }
            Page->>GV: getChangePasswordSuccessMessage() – thông báo thành công
        else Sai mật khẩu hiện tại
            ChangePwdAPI-->>Page: 400 – sai mật khẩu
            Page->>GV: mapChangePasswordApiError() – hiển thị lỗi field
        end
    else Validation thất bại
        Page->>GV: Hiển thị fieldErrors
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/auth/me` | GET | Không (chỉ verify JWT cookie) | Không |
| `/api/auth/change-password` | POST | `user.findUnique` + `user.update(passwordHash)` | Không |

---

## 5. Dashboard (`/giangvien/dashboard`)

### Chức năng
- Tổng quan: số SV đang hướng dẫn, số BCTT chờ duyệt, số BCTT đã duyệt
- Danh sách task gợi ý hành động tiếp theo

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant Page as giangvien/dashboard/page.tsx<br/>LecturerDashboardPage
    participant Stats as LecturerDashboardStats.tsx
    participant Tasks as LecturerDashboardTasks.tsx
    participant API as api/giangvien/dashboard/overview/route.ts GET()
    participant DB as Prisma

    GV->>Page: Mở /giangvien/dashboard
    Page->>API: fetchLecturerDashboardOverview()<br/>lib/utils/giangvien-dashboard.ts<br/>→ GET /api/giangvien/dashboard/overview
    API->>DB: supervisorProfile.findFirst<br/>supervisorAssignmentStudent.findMany (đếm SV đang hướng dẫn)<br/>internshipReport.count (chờ duyệt: REPORT_SUBMITTED)<br/>internshipReport.count (đã duyệt: REPORT_APPROVED)
    DB-->>API: counts
    API->>API: Build: guidingCount, pendingReportCount,<br/>approvedReportCount, tasks[]
    API-->>Page: { success, data: LecturerDashboardItem }
    Page->>Stats: counts
    Page->>Tasks: tasks[]
    Page->>GV: Render dashboard
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/giangvien/dashboard/overview` | GET | `supervisorProfile.findFirst` + `supervisorAssignmentStudent.findMany` + `internshipReport.count` ×2 | `{ guidingCount, pendingReportCount, approvedReportCount, tasks[] }` |

---

## Tổng hợp trạng thái BCTT từ góc độ Giảng viên

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED : SV được phân công GVHD

    NOT_STARTED --> SELF_FINANCED : GV cập nhật "Thực tập tự túc"\n(PATCH update-internship-status/[id])\n→ Email SV

    DOING --> REPORT_SUBMITTED : SV nộp BCTT\n(SV tự nộp)
    SELF_FINANCED --> REPORT_SUBMITTED : SV nộp BCTT\n(SV tự nộp)

    REPORT_SUBMITTED --> REPORT_APPROVED : GV duyệt BCTT\n(PATCH bao-cao-thuc-tap/[id] action=approve)\n→ Email SV (điểm + thông báo Phòng ĐT)
    REPORT_SUBMITTED --> REPORT_REJECTED : GV từ chối BCTT\n(PATCH bao-cao-thuc-tap/[id] action=reject)\n→ Email SV (lý do)

    REPORT_REJECTED --> REPORT_SUBMITTED : SV nộp lại BCTT\n(SV tự nộp lại)

    REPORT_APPROVED --> COMPLETED : Admin cập nhật\n"Hoàn thành thực tập"
    REPORT_APPROVED --> REJECTED_FINAL : Admin cập nhật\n"Chưa hoàn thành thực tập"

    note right of COMPLETED : supervisorAssignment.status\n→ COMPLETED (Hoàn thành hướng dẫn)
```

---

## Tổng hợp API toàn module

| API Route | Method | Auth | Email | Ghi chú |
|-----------|--------|------|-------|---------|
| `/api/giangvien/me` | GET | giangvien | — | Thông tin tài khoản + hồ sơ |
| `/api/giangvien/me` | PATCH | giangvien | — | Cập nhật SĐT + địa chỉ |
| `/api/giangvien/sinh-vien-phan-cong` | GET | giangvien | — | Danh sách SV phân công + chi tiết (report trả `reportUrl`, không trả file base64) |
| `/api/giangvien/bao-cao-thuc-tap` | GET | giangvien | — | Danh sách SV + metadata BCTT (đã tách file nặng khỏi payload) |
| `/api/files/internship-report/[id]` | GET | admin/giangvien/sinhvien | — | Xem/tải file BCTT theo quyền |
| `/api/giangvien/bao-cao-thuc-tap/update-internship-status/[id]` | PATCH | giangvien | Có | Cập nhật TT thực tập → SELF_FINANCED |
| `/api/giangvien/bao-cao-thuc-tap/[id]` | PATCH | giangvien | Có | Duyệt / Từ chối BCTT |
| `/api/giangvien/dashboard/overview` | GET | giangvien | — | Tổng quan dashboard |
| `/api/auth/me` | GET | cookie | — | Lấy role + home URL |
| `/api/auth/change-password` | POST | cookie | — | Đổi mật khẩu |
