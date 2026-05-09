# Module Sinh viên

---

## Bảng tổng quan

| Module | Route | API chính | Email |
|--------|-------|-----------|-------|
| Tài khoản | `/sinhvien/ho-so` | `/api/sinhvien/tai-khoan`, `/api/sinhvien/ho-so-sinh-vien` | Không |
| Tra cứu & ứng tuyển | `/sinhvien/tra-cuu-ung-tuyen` | `/api/sinhvien/tra-cuu-ung-tuyen` | Không |
| Quản lý đăng ký ứng tuyển | `/sinhvien/quan-ly-dang-ky-ung-tuyen` | `/api/sinhvien/ung-tuyen` | Có (DN + SV) |
| Tiến độ thực tập | `/sinhvien/bao-cao-thuc-tap` | `/api/sinhvien/bao-cao-thuc-tap` | Có (GVHD + SV) |
| Đổi mật khẩu | `/auth/doimatkhau` | `/api/auth/change-password` | Không |
| Dashboard | `/sinhvien/dashboard` | `/api/sinhvien/dashboard/overview` | Không |

### Ghi chú hiệu năng
- DashboardShell đã bỏ reload toàn trang sau mutation; trải nghiệm nộp/cập nhật dữ liệu phản hồi nhanh hơn.
- API tìm việc (`/api/sinhvien/tra-cuu-ung-tuyen`) giới hạn query ngắn: `contains` chỉ chạy khi `q.length >= 2`.

---

## Tech Stack & cấu trúc thư mục

```
app/
├── sinhvien/
│   ├── layout.tsx                          # SinhvienLayout – bọc DashboardShell role="sinhvien"
│   ├── dashboard/
│   │   ├── page.tsx                        # StudentDashboardPage
│   │   └── components/
│   │       ├── StudentDashboardStats.tsx   # StudentDashboardStats
│   │       └── StudentDashboardTasks.tsx   # StudentDashboardTasks
│   ├── ho-so/
│   │   ├── page.tsx                        # SinhVienHoSoPage
│   │   └── components/
│   │       ├── SinhVienAccountInfo.tsx     # Thông tin tài khoản (read-only)
│   │       ├── SinhVienSupervisorInfo.tsx  # Thông tin GVHD
│   │       └── SinhVienProfileEditSection.tsx # Chỉnh sửa hồ sơ
│   ├── tra-cuu-ung-tuyen/
│   │   ├── page.tsx                        # SinhVienTraCuuUngTuyenPage
│   │   ├── components/
│   │   │   ├── TraCuuUngTuyenToolbar.tsx
│   │   │   └── TraCuuUngTuyenJobGrid.tsx
│   │   └── [id]/
│   │       ├── page.tsx                    # SinhVienJobDetailPage
│   │       └── components/
│   │           ├── JobDetailInfo.tsx
│   │           └── ApplyFormPopup.tsx
│   ├── quan-ly-dang-ky-ung-tuyen/
│   │   ├── page.tsx                        # SinhVienQuanLyUngTuyenPage
│   │   └── components/
│   │       ├── QuanLyUngTuyenToolbar.tsx
│   │       └── QuanLyUngTuyenTableSection.tsx (+ inner ActionCell)
│   └── bao-cao-thuc-tap/
│       ├── page.tsx                        # SinhvienBaoCaoThucTapPage
│       └── components/
│           ├── BaoCaoThucTapStatusSection.tsx
│           ├── BaoCaoThucTapSupervisorSection.tsx
│           ├── BaoCaoThucTapStatusHistorySection.tsx
│           ├── BaoCaoThucTapResultSection.tsx
│           ├── BaoCaoThucTapUploadPopup.tsx
│           └── BaoCaoThucTapEditPopup.tsx
│
├── auth/doimatkhau/
│   ├── page.tsx                            # ChangePasswordPage
│   └── components/ChangePasswordFormCard.tsx
│
└── api/sinhvien/
    ├── tai-khoan/route.ts                  # GET
    ├── ho-so-sinh-vien/route.ts            # GET, PATCH
    ├── tra-cuu-ung-tuyen/route.ts          # GET
    ├── tra-cuu-ung-tuyen/[id]/route.ts     # GET
    ├── tra-cuu-ung-tuyen/[id]/apply/route.ts # POST
    ├── ung-tuyen/route.ts                  # GET
    ├── ung-tuyen/[id]/route.ts             # PATCH
    ├── bao-cao-thuc-tap/route.ts           # GET, POST, PATCH
    └── dashboard/overview/route.ts         # GET

lib/
├── constants/
│   ├── sinhvien.ts                         # SINHVIEN_DASHBOARD_NAV, nav routes
│   ├── sinhvien-ho-so.ts                   # endpoints, PHONE_PATTERN, CV_ALLOWED_MIMES
│   ├── sinhvien-tra-cuu-ung-tuyen.ts       # list endpoint, status labels
│   ├── sinhvien-tra-cuu-ung-tuyen-detail.ts# detail path, validation strings
│   ├── sinhvien-quan-ly-dang-ky-ung-tuyen.ts # endpoint, labels, button texts
│   ├── sinhvien-bao-cao-thuc-tap.ts        # endpoint, BCTT_ALLOWED_MIMES, status labels
│   └── sinhvien-dashboard.ts              # SINHVIEN_DASHBOARD_OVERVIEW_ENDPOINT
├── types/
│   ├── sinhvien-ho-so.ts                   # StudentAccount, SupervisorInfo, SinhVienHoSoProfile...
│   ├── sinhvien-ho-so-shared.ts            # StudentDegree, Gender, SupervisorDegree
│   ├── sinhvien-tra-cuu-ung-tuyen.ts       # SinhVienTraCuuUngTuyenItem, WorkType, InternshipStatus
│   ├── sinhvien-tra-cuu-ung-tuyen-detail.ts# SinhVienTraCuuUngTuyenJobDetail, SinhVienApplyProfile
│   ├── sinhvien-quan-ly-dang-ky-ung-tuyen.ts # SinhVienQuanLyDangKyUngTuyenRow, AppStatus...
│   ├── sinhvien-bao-cao-thuc-tap.ts        # InternshipStatus, Report, StatusHistoryEvent...
│   └── sinhvien-dashboard.ts              # StudentDashboardItem, StudentDashboardOverviewResponse
└── utils/
    ├── sinhvien-ho-so.ts                   # buildSinhVienHoSoPatchPayload, validateSinhVienHoSoDraft...
    ├── sinhvien-tra-cuu-ung-tuyen.ts       # buildSinhVienTraCuuUngTuyenListUrl, fetchList...
    ├── sinhvien-tra-cuu-ung-tuyen-detail.ts# fetchDetail, validateApplyDraft, buildApplyPayload...
    ├── sinhvien-quan-ly-dang-ky-ung-tuyen.ts # buildListUrl, buildRespondEndpoint, canRespond...
    ├── sinhvien-bao-cao-thuc-tap.ts        # helpers cho BCTT page
    └── sinhvien-dashboard.ts              # fetchStudentDashboardOverview, getErrorMessage...
```

---

## 1. Tài khoản (`/sinhvien/ho-so`)

### Chức năng
- Xem thông tin tài khoản (MSV, lớp, khoa, khóa, bậc) — **read-only**
- Xem thông tin GVHD được phân công (hoặc "Chưa được phân công")
- Xem & chỉnh sửa hồ sơ cá nhân: SĐT, email, địa chỉ thường trú, thư giới thiệu, CV

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as sinhvien/ho-so/page.tsx<br/>SinhVienHoSoPage
    participant AccInfo as SinhVienAccountInfo.tsx
    participant SupInfo as SinhVienSupervisorInfo.tsx
    participant EditSec as SinhVienProfileEditSection.tsx
    participant API1 as api/sinhvien/tai-khoan/route.ts<br/>GET()
    participant API2 as api/sinhvien/ho-so-sinh-vien/route.ts<br/>GET() / PATCH()
    participant VNAPI as /api/vn-address/*
    participant DB as Prisma

    Note over SV,DB: ── Tải trang ──
    SV->>Page: Mở /sinhvien/ho-so
    Page->>API1: GET /api/sinhvien/tai-khoan
    API1->>DB: studentProfile.findFirst<br/>+ supervisorAssignmentStudent.findFirst
    DB-->>API1: { student, supervisor | null }
    API1-->>Page: { success, student, supervisor }
    Page->>AccInfo: Props: student (MSV, lớp, khoa, khóa, bậc)
    Page->>SupInfo: Props: supervisor (họ tên, SĐT, email, giới tính, bậc)

    Page->>API2: GET /api/sinhvien/ho-so-sinh-vien
    API2->>DB: studentProfile.findFirst + user fields
    DB-->>API2: editable profile fields
    API2-->>Page: { success, item }
    Page->>EditSec: Props: profile (SĐT, email, địa chỉ, intro, CV)

    Note over SV,DB: ── Tải địa chỉ tỉnh/phường ──
    Page->>VNAPI: GET /api/vn-address/provinces
    VNAPI-->>Page: provinces[]
    Page->>VNAPI: GET /api/vn-address/provinces/{code}/wards
    VNAPI-->>Page: wards[]

    Note over SV,DB: ── Chỉnh sửa hồ sơ ──
    SV->>EditSec: Nhấn "Chỉnh sửa"
    EditSec->>Page: startEdit()
    SV->>EditSec: Sửa thông tin + upload CV (pdf/docx)
    EditSec->>Page: submitProfile()
    Page->>Page: validateSinhVienHoSoDraft()<br/>lib/utils/sinhvien-ho-so.ts
    alt Hợp lệ
        Page->>API2: PATCH /api/sinhvien/ho-so-sinh-vien<br/>{ phone, email, province, ward, intro, cv* }
        API2->>API2: fetchProvinceList / fetchWardsForProvince<br/>lib/vn-open-api.ts
        API2->>DB: $transaction:<br/>user.update(phone, email)<br/>studentProfile.update(address, intro, cv)
        DB-->>API2: OK
        API2-->>Page: { success, message }
        Page->>API2: GET /api/sinhvien/ho-so-sinh-vien (refresh)
        Page->>SV: Toast thành công
    else Lỗi validation
        Page->>SV: Hiển thị fieldErrors
    end
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/sinhvien/tai-khoan` | GET | `studentProfile.findFirst` + `supervisorAssignmentStudent.findFirst` | `{ student, supervisor \| null }` |
| `/api/sinhvien/ho-so-sinh-vien` | GET | `studentProfile.findFirst` + `user` | `{ item: profile }` |
| `/api/sinhvien/ho-so-sinh-vien` | PATCH | `$transaction`: `user.update` + `studentProfile.update` | `{ success, message }` hoặc `{ errors }` |

---

## 2. Tra cứu & ứng tuyển (`/sinhvien/tra-cuu-ung-tuyen`)

### Chức năng
- Xem danh sách tin tuyển dụng đang hoạt động (lọc theo từ khóa, loại công việc, địa điểm Tỉnh/Thành)
- Xem chi tiết tin tuyển dụng
- Nộp hồ sơ ứng tuyển (chỉ khi `internshipStatus = NOT_STARTED`)

### Điều kiện nộp hồ sơ
- Sinh viên phải có `internshipStatus = "NOT_STARTED"` (Chưa thực tập)
- Tin tuyển dụng phải còn trong hạn (`deadline ≥ now`) và trạng thái `ACTIVE`
- Doanh nghiệp phải có `enterpriseStatus = APPROVED`
- Mỗi SV chỉ nộp 1 hồ sơ / 1 tin

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant ListPage as tra-cuu-ung-tuyen/page.tsx<br/>SinhVienTraCuuUngTuyenPage
    participant Toolbar as TraCuuUngTuyenToolbar.tsx
    participant Grid as TraCuuUngTuyenJobGrid.tsx
    participant DetailPage as tra-cuu-ung-tuyen/[id]/page.tsx<br/>SinhVienJobDetailPage
    participant Popup as ApplyFormPopup.tsx
    participant ListAPI as api/sinhvien/tra-cuu-ung-tuyen/route.ts GET()
    participant DetailAPI as api/sinhvien/tra-cuu-ung-tuyen/[id]/route.ts GET()
    participant ApplyAPI as api/sinhvien/tra-cuu-ung-tuyen/[id]/apply/route.ts POST()
    participant ProfileAPI as api/sinhvien/ho-so-sinh-vien/route.ts GET()
    participant DB as Prisma

    Note over SV,DB: ── Danh sách tin tuyển dụng ──
    SV->>ListPage: Mở /sinhvien/tra-cuu-ung-tuyen
    ListPage->>ListAPI: GET /api/sinhvien/tra-cuu-ung-tuyen<br/>?q=&workType=&field=
    Note over ListAPI,DB: Filter theo Khoa SV (faculty):<br/>· allowedFaculties rỗng → thấy tất cả<br/>· hoặc allowedFaculties chứa faculty của SV
    ListAPI->>DB: studentProfile.findFirst(faculty, internshipStatus)<br/>jobPost.findMany(ACTIVE, deadline≥now, enterprise APPROVED, faculty filter)<br/>+ jobApplication.findMany(hasApplied)
    DB-->>ListAPI: jobs + internshipStatus
    ListAPI-->>ListPage: { success, internshipStatus, canApply, items[] }
    ListPage->>Grid: Render danh sách tin

    SV->>Toolbar: Nhập từ khóa / chọn bộ lọc → "Tìm kiếm"
    Toolbar->>ListPage: onSearch({ q, workType, province })
    ListPage->>ListAPI: GET ... với query params mới
    ListAPI-->>ListPage: items[] đã lọc

    Note over SV,DB: ── Xem chi tiết & nộp hồ sơ ──
    SV->>DetailPage: Click vào tin → /sinhvien/tra-cuu-ung-tuyen/{id}
    DetailPage->>DetailAPI: GET /api/sinhvien/tra-cuu-ung-tuyen/{id}
    DetailAPI->>DB: jobPost + studentProfile + jobApplication
    DB-->>DetailAPI: { item: { ...job, internshipStatus, canApply, hasApplied, appliedAt } }
    DetailAPI-->>DetailPage: job detail
    DetailPage->>DetailPage: loadDetail()

    alt canApply = true và chưa nộp
        SV->>DetailPage: Nhấn "Ứng tuyển"
        DetailPage->>ProfileAPI: GET /api/sinhvien/ho-so-sinh-vien
        ProfileAPI-->>DetailPage: profile (intro, cv hiện tại)
        DetailPage->>Popup: openApply() → hiển thị ApplyFormPopup
        SV->>Popup: Điền thư giới thiệu + upload CV (pdf/docx)
        Popup->>DetailPage: submitApply()
        DetailPage->>DetailPage: validateSinhVienApplyDraft()<br/>lib/utils/sinhvien-tra-cuu-ung-tuyen-detail.ts
        alt Hợp lệ
            DetailPage->>ApplyAPI: POST /api/sinhvien/tra-cuu-ung-tuyen/{id}/apply<br/>{ intro, cv* }
            ApplyAPI->>ApplyAPI: Kiểm tra: job còn hạn, SV NOT_STARTED, không trùng
            ApplyAPI->>DB: $transaction:<br/>user.update(phone, email)<br/>studentProfile.update(intro, cv)<br/>jobApplication.create({ history })
            DB-->>ApplyAPI: OK
            ApplyAPI-->>DetailPage: { success, message }
            DetailPage->>SV: Toast "Nộp hồ sơ thành công"
        else Lỗi
            DetailPage->>SV: Hiển thị lỗi
        end
    else canApply = false
        DetailPage->>SV: Hiển thị ghi chú trạng thái<br/>getSinhVienTraCuuUngTuyenStatusNoteText()
    end
```

### API chi tiết

| Route | Method | Điều kiện | Prisma | Email |
|-------|--------|-----------|--------|-------|
| `/api/sinhvien/tra-cuu-ung-tuyen` | GET | — | `jobPost.findMany` (ACTIVE + deadline + enterprise APPROVED) + `studentProfile` + `jobApplication` | Không |
| `/api/sinhvien/tra-cuu-ung-tuyen/[id]` | GET | — | `jobPost` + `studentProfile` + `jobApplication` | Không |
| `/api/sinhvien/tra-cuu-ung-tuyen/[id]/apply` | POST | `internshipStatus = NOT_STARTED`, không trùng, job còn hạn | `$transaction`: `user.update` + `studentProfile.update` + `jobApplication.create` | Không |

---

## 3. Quản lý đăng ký ứng tuyển (`/sinhvien/quan-ly-dang-ky-ung-tuyen`)

### Chức năng
- Xem danh sách hồ sơ đã nộp kèm trạng thái
- Lọc theo trạng thái (`Chờ xem xét`, `Mời phỏng vấn`, `Trúng tuyển`, `Từ chối`)
- Xem chi tiết lời mời phỏng vấn / trúng tuyển (popup) từ cột **Thao tác**
- Phản hồi lời mời phỏng vấn / thực tập (Xác nhận / Từ chối) từ cột **Thao tác**
- Sau khi phản hồi: cả 2 nút đều bị vô hiệu hoá (1 lần duy nhất)

### Trạng thái & luồng phản hồi

```
Trạng thái ứng tuyển (AppStatus)      Trạng thái phản hồi (ResponseStatus)
─────────────────────────────────────  ───────────────────────────────────────
PENDING      → Chờ xem xét            (chưa có)
INTERVIEW_INVITED → Mời phỏng vấn  →  SV phản hồi: CONFIRM_INTERVIEW / DECLINE_INTERVIEW
OFFERED      → Trúng tuyển         →  SV phản hồi: CONFIRM_INTERNSHIP / DECLINE_INTERNSHIP
REJECTED     → Từ chối                (không phản hồi)
STUDENT_DECLINED → Từ chối (SV)       (đã phản hồi)
```

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as quan-ly-dang-ky-ung-tuyen/page.tsx<br/>SinhVienQuanLyUngTuyenPage
    participant Toolbar as QuanLyUngTuyenToolbar.tsx
    participant Table as QuanLyUngTuyenTableSection.tsx<br/>ActionCell
    participant ListAPI as api/sinhvien/ung-tuyen/route.ts GET()
    participant RespondAPI as api/sinhvien/ung-tuyen/[id]/route.ts PATCH()
    participant DB as Prisma
    participant Mail as lib/mail.ts → sendMail()

    Note over SV,Mail: ── Tải danh sách ──
    SV->>Page: Mở /sinhvien/quan-ly-dang-ky-ung-tuyen
    Page->>ListAPI: GET /api/sinhvien/ung-tuyen
    ListAPI->>DB: jobApplication.findMany + jobPost + enterprise
    DB-->>ListAPI: applications[]
    ListAPI-->>Page: { success, items[] }
    Page->>Table: Render danh sách

    Note over SV,Mail: ── Lọc theo trạng thái ──
    SV->>Toolbar: Chọn trạng thái → "Tìm kiếm"
    Toolbar->>Page: onSearch(statusFilter)
    Page->>ListAPI: GET /api/sinhvien/ung-tuyen?status={filter}
    ListAPI-->>Page: items[] đã lọc

    Note over SV,Mail: ── Phản hồi (từ email hoặc trực tiếp) ──
    SV->>Table: Nhấn nút Xác nhận / Từ chối (action cell)
    Table->>Page: respond(applicationId, action)
    Page->>RespondAPI: PATCH /api/sinhvien/ung-tuyen/{id}<br/>{ action: CONFIRM_INTERVIEW | DECLINE_INTERVIEW<br/>        | CONFIRM_INTERNSHIP | DECLINE_INTERNSHIP }
    RespondAPI->>DB: jobApplication (kiểm tra status + response)
    alt CONFIRM_INTERNSHIP
        RespondAPI->>DB: $transaction:<br/>jobApplication.update(status=OFFERED, response=CONFIRMED)<br/>studentProfile.update(internshipStatus=DOING)<br/>internshipStatusHistory.create
    else Các action khác
        RespondAPI->>DB: jobApplication.update(response)
    end
    RespondAPI->>Mail: sendMail → DN (thông báo phản hồi SV)
    RespondAPI->>Mail: sendMail → SV (xác nhận bản sao)
    Note over Mail: Lỗi email không block response
    RespondAPI-->>Page: { success, message }
    Page->>Page: load() – reload danh sách
    Page->>SV: Toast kết quả

    Note over Table: Sau khi phản hồi: cả 2 nút Xác nhận + Từ chối đều disabled<br/>canRespond() = false (lib/utils/sinhvien-quan-ly-dang-ky-ung-tuyen.ts)
```

### API chi tiết

| Route | Method | Body | Prisma | Email |
|-------|--------|------|--------|-------|
| `/api/sinhvien/ung-tuyen` | GET | `?status=` | `jobApplication.findMany` + `jobPost` + enterprise + `history` (lấy `interviewLocation/responseDeadline` từ `history`) | Không |
| `/api/sinhvien/ung-tuyen/[id]` | PATCH | `{ action }` | `jobApplication.update` + (nếu CONFIRM_INTERNSHIP) `$transaction` cập nhật `internshipStatus=DOING` + `internshipStatusHistory.create` | Có: DN + SV |

### Email gửi đi khi phản hồi

| Sự kiện | Người nhận | Nội dung |
|---------|-----------|---------|
| `CONFIRM_INTERVIEW` | DN | SV xác nhận tham gia phỏng vấn |
| `DECLINE_INTERVIEW` | DN | SV từ chối phỏng vấn |
| `CONFIRM_INTERNSHIP` | DN | SV xác nhận thực tập (kèm cập nhật `internshipStatus=DOING`) |
| `DECLINE_INTERNSHIP` | DN | SV từ chối thực tập |
| Tất cả | SV | Email xác nhận bản sao hành động |

---

## 4. Quản lý tiến độ thực tập (`/sinhvien/bao-cao-thuc-tap`)

### Chức năng
- Xem thông tin GVHD (nếu đã được phân công)
- Theo dõi trạng thái thực tập hiện tại & lịch sử thay đổi
- Nộp BCTT (chỉ active khi `internshipStatus = DOING` hoặc `SELF_FINANCED`)
- Sửa BCTT (chỉ active khi GVHD từ chối — `reviewStatus = REJECTED`)
- Xem kết quả thực tập khi `internshipStatus = COMPLETED` (đánh giá, điểm, file BCTT)

### Trạng thái & điều kiện

```
internshipStatus          canSubmitReport    canEditReport
──────────────────────    ───────────────    ─────────────
NOT_STARTED               false              false
DOING                     true (nếu chưa nộp)  false
SELF_FINANCED             true (nếu chưa nộp)  false
REPORT_SUBMITTED          false              false (đang chờ duyệt)
REPORT_REJECTED           false              true  (GVHD từ chối)
REPORT_APPROVED           false              false
COMPLETED                 false              false  → hiển thị kết quả
REJECTED (Chưa HT)        false              false
```

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as bao-cao-thuc-tap/page.tsx<br/>SinhvienBaoCaoThucTapPage
    participant SupSec as BaoCaoThucTapSupervisorSection
    participant StatusSec as BaoCaoThucTapStatusSection
    participant HistSec as BaoCaoThucTapStatusHistorySection
    participant ResultSec as BaoCaoThucTapResultSection
    participant UploadPop as BaoCaoThucTapUploadPopup
    participant EditPop as BaoCaoThucTapEditPopup
    participant API as api/sinhvien/bao-cao-thuc-tap/route.ts
    participant DB as Prisma
    participant Mail as sendMail()

    Note over SV,Mail: ── Tải trang ──
    SV->>Page: Mở /sinhvien/bao-cao-thuc-tap
    Page->>API: GET /api/sinhvien/bao-cao-thuc-tap
    API->>DB: studentProfile + internshipStatus + internshipStatusHistory<br/>+ internshipReport ($queryRaw: supervisorPoint, enterprisePoint)<br/>+ supervisorAssignmentStudent (GVHD)
    DB-->>API: full data
    API-->>Page: { internshipStatus, supervisor, report, statusHistory,<br/>canSubmitReport, canEditReport }
    Page->>SupSec: Thông tin GVHD (họ tên, SĐT, email, giới tính, bậc)
    Page->>StatusSec: Trạng thái hiện tại + nút Nộp BCTT / Sửa BCTT
    Page->>HistSec: Lịch sử thay đổi trạng thái
    alt internshipStatus = COMPLETED
        Page->>ResultSec: Kết quả (đánh giá, điểm, file BCTT)
    end

    Note over SV,Mail: ── Nộp BCTT lần đầu (canSubmitReport = true) ──
    SV->>StatusSec: Nhấn button "Nộp BCTT" (active)
    StatusSec->>Page: Mở BaoCaoThucTapUploadPopup
    SV->>UploadPop: Upload file BCTT (pdf/docx)
    UploadPop->>Page: onChooseFile(file)
    SV->>UploadPop: Nhấn "Gửi"
    Page->>Page: submitNewReport()
    Page->>API: POST /api/sinhvien/bao-cao-thuc-tap { file }
    API->>API: Kiểm tra: DOING hoặc SELF_FINANCED + chưa có report
    API->>DB: $transaction:<br/>internshipReport.create<br/>studentProfile.update(internshipStatus=REPORT_SUBMITTED)<br/>internshipStatusHistory.create
    DB-->>API: OK
    API->>Mail: sendMail → GVHD (SV đã nộp BCTT)
    API->>Mail: sendMail → SV (xác nhận nộp thành công)
    API-->>Page: { success, message }
    Page->>Page: load() – reload
    Page->>SV: Toast + nút "Nộp BCTT" inactive, hiển thị "Sửa BCTT" inactive

    Note over SV,Mail: ── Sửa BCTT (canEditReport = true, GVHD từ chối) ──
    SV->>StatusSec: Nhấn button "Sửa BCTT" (active)
    StatusSec->>Page: Mở BaoCaoThucTapEditPopup
    EditPop->>SV: Hiển thị lý do từ chối của GVHD
    SV->>EditPop: Xóa file cũ → upload file mới
    Page->>Page: submitEditReport()
    Page->>API: PATCH /api/sinhvien/bao-cao-thuc-tap { file }
    API->>API: Kiểm tra: reviewStatus = REJECTED
    API->>DB: internshipReport.update(file, reviewStatus=PENDING, xóa reject fields)<br/>studentProfile.update(internshipStatus=REPORT_SUBMITTED)<br/>internshipStatusHistory.create
    DB-->>API: OK
    API->>Mail: sendMail → GVHD (SV đã nộp lại BCTT)
    API-->>Page: { success, message }
    Page->>Page: load()
    Page->>SV: Toast thành công
```

### API chi tiết

| Route | Method | Điều kiện | Prisma | Email |
|-------|--------|-----------|--------|-------|
| `/api/sinhvien/bao-cao-thuc-tap` | GET | SV đã login | `studentProfile` + `internshipStatusHistory` + `internshipReport` ($queryRaw) + supervisor | Không |
| `/api/sinhvien/bao-cao-thuc-tap` | POST | `DOING` hoặc `SELF_FINANCED`, chưa có report | `$transaction`: `internshipReport.create` + `studentProfile.update(REPORT_SUBMITTED)` + `internshipStatusHistory.create` | GVHD + SV |
| `/api/sinhvien/bao-cao-thuc-tap` | PATCH | `reviewStatus = REJECTED` | `internshipReport.update` + `studentProfile.update(REPORT_SUBMITTED)` + `internshipStatusHistory.create` | GVHD |

### Email gửi đi

| Sự kiện | Người nhận | Nội dung |
|---------|-----------|---------|
| SV nộp BCTT lần đầu (POST) | GVHD | Thông báo SV đã nộp BCTT, yêu cầu duyệt |
| SV nộp BCTT lần đầu (POST) | SV | Xác nhận nộp thành công |
| SV nộp lại BCTT sau từ chối (PATCH) | GVHD | Thông báo SV đã nộp lại BCTT |

---

## 5. Đổi mật khẩu (`/auth/doimatkhau`)

### Chức năng
- Đổi mật khẩu khi đã đăng nhập
- Yêu cầu nhập mật khẩu hiện tại để xác thực
- Admin bị chặn (trả 403)

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as auth/doimatkhau/page.tsx<br/>ChangePasswordPage
    participant Card as ChangePasswordFormCard.tsx
    participant MeAPI as api/auth/me/route.ts GET()
    participant ChangePwdAPI as api/auth/change-password/route.ts POST()
    participant Lib as lib/auth/
    participant DB as Prisma

    Note over SV,DB: ── Tải trang ──
    SV->>Page: Mở /auth/doimatkhau
    Page->>MeAPI: GET /api/auth/me
    MeAPI->>MeAPI: verifySession(cookies) [lib/auth/jwt.ts]
    MeAPI-->>Page: { authenticated, role, home: "/sinhvien/dashboard" }
    Page->>Card: Render form + link "Quay lại bảng điều khiển"

    Note over SV,DB: ── Đổi mật khẩu ──
    SV->>Card: Nhập MK hiện tại + MK mới + xác nhận MK mới
    Card->>Page: handleSubmit(form)
    Page->>Page: validateChangePasswordForm()<br/>lib/utils/auth/change-password.ts
    alt Validation thành công
        Page->>ChangePwdAPI: POST /api/auth/change-password<br/>{ currentPassword, newPassword, confirmPassword }
        ChangePwdAPI->>ChangePwdAPI: verifySession(cookie) [lib/auth/jwt.ts]
        ChangePwdAPI->>ChangePwdAPI: Kiểm tra role ≠ admin → 403 nếu admin
        ChangePwdAPI->>DB: prisma.user.findUnique({ where: { id } })
        ChangePwdAPI->>Lib: password.ts → verifyPassword(currentPwd, hash)<br/>[bcryptjs.compare]
        alt Mật khẩu hiện tại đúng
            ChangePwdAPI->>Lib: password.ts → hashPassword(newPwd) [bcryptjs.hash]
            ChangePwdAPI->>DB: prisma.user.update({ data: { passwordHash } })
            ChangePwdAPI-->>Page: 200 { success, message }
            Page->>SV: getChangePasswordSuccessMessage() – hiển thị thành công
        else Sai mật khẩu hiện tại
            ChangePwdAPI-->>Page: 400 – sai mật khẩu
            Page->>SV: mapChangePasswordApiError() – hiển thị lỗi field
        end
    else Validation thất bại
        Page->>SV: Hiển thị fieldErrors
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/auth/me` | GET | Không (chỉ verify JWT cookie) | Không |
| `/api/auth/change-password` | POST | `user.findUnique` + `user.update` | Không |

---

## 6. Dashboard (`/sinhvien/dashboard`)

### Chức năng
- Hiển thị tổng quan: trạng thái thực tập, số BCTT đã nộp, phản hồi mới từ GVHD
- Hiển thị danh sách task gợi ý hành động tiếp theo

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant Page as sinhvien/dashboard/page.tsx<br/>StudentDashboardPage
    participant Stats as StudentDashboardStats.tsx
    participant Tasks as StudentDashboardTasks.tsx
    participant API as api/sinhvien/dashboard/overview/route.ts GET()
    participant DB as Prisma

    SV->>Page: Mở /sinhvien/dashboard
    Page->>API: fetchStudentDashboardOverview()<br/>lib/utils/sinhvien-dashboard.ts<br/>→ GET /api/sinhvien/dashboard/overview
    API->>DB: studentProfile + internshipStatusHistory<br/>+ internshipReport (summary)
    DB-->>API: raw data
    API->>API: Build: internshipStatusLabel<br/>reportSubmittedCount<br/>newFeedbackCount (reviewed trong 7 ngày)<br/>tasks[] (gợi ý hành động)
    API-->>Page: { success, data }
    Page->>Stats: internshipStatus label, counts
    Page->>Tasks: tasks[]
    Page->>SV: Hiển thị dashboard
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/sinhvien/dashboard/overview` | GET | `studentProfile` + `internshipStatusHistory` + `internshipReport` | `{ internshipStatus, reportSubmittedCount, newFeedbackCount, tasks[] }` |

---

## Tổng hợp luồng trạng thái thực tập của Sinh viên

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED : Tài khoản mới tạo

    NOT_STARTED --> DOING : DN mời thực tập → SV xác nhận\n(PATCH /api/sinhvien/ung-tuyen/[id])
    NOT_STARTED --> SELF_FINANCED : GVHD cập nhật\n(PATCH /api/giangvien/bao-cao-thuc-tap/update-internship-status/[id])

    DOING --> REPORT_SUBMITTED : SV nộp BCTT\n(POST /api/sinhvien/bao-cao-thuc-tap)
    SELF_FINANCED --> REPORT_SUBMITTED : SV nộp BCTT\n(POST /api/sinhvien/bao-cao-thuc-tap)

    REPORT_SUBMITTED --> REPORT_APPROVED : GVHD duyệt BCTT\n(PATCH /api/giangvien/bao-cao-thuc-tap/[id])
    REPORT_SUBMITTED --> REPORT_REJECTED : GVHD từ chối\n(PATCH /api/giangvien/bao-cao-thuc-tap/[id])

    REPORT_REJECTED --> REPORT_SUBMITTED : SV nộp lại BCTT\n(PATCH /api/sinhvien/bao-cao-thuc-tap)

    REPORT_APPROVED --> COMPLETED : Admin cập nhật hoàn thành\n(PATCH /api/admin/tien-do-thuc-tap/[id])
    REPORT_APPROVED --> REJECTED : Admin cập nhật chưa HT\n(PATCH /api/admin/tien-do-thuc-tap/[id])

    REJECTED --> NOT_STARTED : Admin kích hoạt lại tài khoản\n(PATCH /api/admin/accounts/[id]/status)

    COMPLETED --> [*]
```

---

## Tổng hợp API toàn module

| API Route | Method | Auth | Email | Ghi chú |
|-----------|--------|------|-------|---------|
| `/api/sinhvien/tai-khoan` | GET | sinhvien | — | Thông tin tài khoản + GVHD |
| `/api/sinhvien/ho-so-sinh-vien` | GET | sinhvien | — | Profile có thể chỉnh sửa |
| `/api/sinhvien/ho-so-sinh-vien` | PATCH | sinhvien | — | Cập nhật profile + CV |
| `/api/sinhvien/tra-cuu-ung-tuyen` | GET | sinhvien | — | Danh sách tin tuyển dụng |
| `/api/sinhvien/tra-cuu-ung-tuyen/[id]` | GET | sinhvien | — | Chi tiết tin |
| `/api/sinhvien/tra-cuu-ung-tuyen/[id]/apply` | POST | sinhvien | — | Nộp hồ sơ ứng tuyển |
| `/api/sinhvien/ung-tuyen` | GET | sinhvien | — | Danh sách hồ sơ đã nộp |
| `/api/sinhvien/ung-tuyen/[id]` | PATCH | sinhvien | Có | Phản hồi lời mời phỏng vấn/thực tập |
| `/api/sinhvien/bao-cao-thuc-tap` | GET | sinhvien | — | Trạng thái + BCTT + GVHD |
| `/api/sinhvien/bao-cao-thuc-tap` | POST | sinhvien | Có | Nộp BCTT lần đầu |
| `/api/sinhvien/bao-cao-thuc-tap` | PATCH | sinhvien | Có | Nộp lại BCTT sau từ chối |
| `/api/sinhvien/dashboard/overview` | GET | sinhvien | — | Tổng quan dashboard |
| `/api/auth/me` | GET | cookie | — | Lấy role + home URL |
| `/api/auth/change-password` | POST | cookie | — | Đổi mật khẩu |
