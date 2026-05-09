# Module Admin

---

## Bảng tổng quan

| Module | Route | API chính | Email |
|--------|-------|-----------|-------|
| Quản lý doanh nghiệp | `/admin/quan-ly-doanh-nghiep` | `/api/admin/enterprises` | Có (DN: duyệt/từ chối) |
| Quản lý đợt thực tập | `/admin/quan-ly-dot-thuc-tap` | `/api/admin/internship-batches` | Không |
| Quản lý tài khoản | `/admin/quan-ly-tai-khoan` | `/api/admin/accounts` | Không |
| Phân công GVHD | `/admin/phan-cong-gvhd` | `/api/admin/assignments` | Có (GV + SV) |
| Quản lý sinh viên | `/admin/quan-ly-sinh-vien` | `/api/admin/students` | Không |
| Quản lý GVHD | `/admin/quan-ly-gvhd` | `/api/admin/supervisors` | Không |
| Quản lý tin tuyển dụng | `/admin/quan-ly-tin-tuyen-dung` | `/api/admin/job-posts` | Có (DN: duyệt/từ chối/dừng) |
| Quản lý tiến độ thực tập | `/admin/quan-ly-tien-do-thuc-tap` | `/api/admin/tien-do-thuc-tap` | Có (SV + GVHD) |
| Dashboard | `/admin/dashboard` | `/api/admin/dashboard/overview` | Không |

### Ghi chú hiệu năng
- Các popup nặng ở trang admin (view/add/edit/delete/status) đã chuyển sang lazy-load (dynamic import) để giảm lag khi chuyển tab/page và khi click mở popup.
- DashboardShell không còn ép `window.location.reload()` sau mọi mutation; luồng create/update/delete giữ ở mức refresh theo từng page.
- Chuẩn search mới cho API admin: ưu tiên `startsWith` với field định danh (`msv`, `phone`, `email`, `taxCode`), `contains` chỉ áp cho text tự do và chỉ khi `q.length >= 2`.

---

## Tech Stack & cấu trúc thư mục

```
app/
├── admin/
│   ├── layout.tsx                                        # AdminLayout – DashboardShell role="admin"
│   ├── styles/dashboard.module.css
│   ├── components/
│   │   ├── AdminDashboardCharts.tsx                      # DonutChart, BarChart, ProgressColumnChart, LineChart, TopFieldsCard
│   │   ├── EnterpriseViewDetailTable.tsx
│   │   └── EnterpriseStatusCell.tsx
│   ├── dashboard/page.tsx                                # AdminDashboardPage
│   ├── quan-ly-doanh-nghiep/
│   │   ├── page.tsx                                      # AdminQuanLyDoanhNghiepPage
│   │   └── components/
│   │       ├── AdminEnterpriseToolbar.tsx
│   │       ├── AdminEnterpriseTable.tsx
│   │       ├── AdminEnterpriseViewPopup.tsx
│   │       └── AdminEnterpriseStatusPopup.tsx
│   ├── quan-ly-dot-thuc-tap/
│   │   ├── page.tsx                                      # AdminQuanLyDotThucTapPage
│   │   └── components/
│   │       ├── AdminInternshipBatchToolbar.tsx
│   │       ├── AdminInternshipBatchTableSection.tsx
│   │       ├── AdminInternshipBatchEditModal.tsx
│   │       ├── AdminInternshipBatchViewPopup.tsx
│   │       ├── AdminInternshipBatchStatusPopup.tsx
│   │       └── AdminInternshipBatchDeletePopup.tsx
│   ├── quan-ly-tai-khoan/
│   │   ├── page.tsx                                      # AdminQuanLyTaiKhoanPage
│   │   └── components/
│   │       ├── AdminTaiKhoanToolbar.tsx
│   │       ├── AdminTaiKhoanTableSection.tsx
│   │       ├── AdminTaiKhoanViewPopup.tsx  (+ inner ViewBody)
│   │       ├── AdminTaiKhoanStatusPopup.tsx
│   │       └── AdminTaiKhoanDeletePopup.tsx
│   ├── phan-cong-gvhd/
│   │   ├── page.tsx                                      # AdminPhanCongGVHDPage
│   │   └── components/
│   │       ├── AdminPhanCongGVHDToolbar.tsx
│   │       ├── AdminPhanCongGVHDTable.tsx                # exports Props type
│   │       ├── AdminPhanCongGVHDFormPopup.tsx            # exports Props type
│   │       ├── AdminPhanCongGVHDViewPopup.tsx
│   │       └── AdminPhanCongGVHDDeletePopup.tsx
│   ├── quan-ly-sinh-vien/
│   │   ├── page.tsx                                      # AdminQuanLySinhVienPage
│   │   └── components/
│   │       ├── AdminSinhVienToolbar.tsx
│   │       ├── AdminSinhVienTableSection.tsx
│   │       ├── AdminSinhVienFormPopup.tsx
│   │       ├── AdminSinhVienViewPopup.tsx
│   │       ├── AdminSinhVienStatusPopup.tsx
│   │       ├── AdminSinhVienDeletePopup.tsx
│   │       └── AdminSinhVienImportPopup.tsx
│   ├── quan-ly-gvhd/
│   │   ├── page.tsx                                      # AdminQuanLyGVHDPage
│   │   └── components/
│   │       ├── AdminGiangVienToolbar.tsx
│   │       ├── AdminGiangVienTableSection.tsx
│   │       ├── AdminGiangVienFormPopup.tsx
│   │       ├── AdminGiangVienViewPopup.tsx
│   │       ├── AdminGiangVienDeletePopup.tsx
│   │       └── AdminGiangVienImportPopup.tsx
│   ├── quan-ly-tin-tuyen-dung/
│   │   ├── page.tsx                                      # AdminQuanLyTinTuyenDungPage
│   │   └── components/
│   │       ├── AdminTinTuyenDungToolbar.tsx
│   │       ├── AdminTinTuyenDungTableSection.tsx
│   │       ├── AdminTinTuyenDungViewPopup.tsx
│   │       ├── AdminTinTuyenDungStatusPopup.tsx
│   │       └── AdminTinTuyenDungDeletePopup.tsx
│   └── quan-ly-tien-do-thuc-tap/
│       ├── page.tsx                                      # AdminTienDoThucTapPage
│       └── components/
│           ├── AdminTienDoToolbar.tsx
│           ├── AdminTienDoTableSection.tsx
│           ├── AdminTienDoViewPopup.tsx
│           └── AdminTienDoEditModal.tsx
│
└── api/admin/
    ├── dashboard/overview/route.ts                       # GET
    ├── enterprises/route.ts                              # GET
    ├── enterprises/[id]/route.ts                         # GET, DELETE
    ├── enterprises/[id]/status/route.ts                  # POST (approve/reject)
    ├── internship-batches/route.ts                       # GET, POST
    ├── internship-batches/[id]/route.ts                  # GET, PATCH, DELETE
    ├── internship-batches/[id]/status/route.ts           # PATCH (close)
    ├── accounts/route.ts                                 # GET
    ├── accounts/[id]/route.ts                            # GET, DELETE
    ├── accounts/[id]/status/route.ts                     # PATCH (active/locked)
    ├── assignments/route.ts                              # GET, POST
    ├── assignments/[id]/route.ts                         # GET, DELETE
    ├── assignments/options/route.ts                      # GET (faculties + openBatches)
    ├── assignments/options/supervisors/route.ts          # GET
    ├── assignments/options/students/route.ts             # GET
    ├── students/route.ts                                 # GET, POST
    ├── students/[id]/route.ts                            # GET, PATCH, DELETE
    ├── students/[id]/internship-status/route.ts          # PATCH
    ├── students/import/route.ts                          # POST (bulk)
    ├── supervisors/route.ts                              # GET, POST
    ├── supervisors/[id]/route.ts                         # GET, PATCH, DELETE
    ├── supervisors/import/route.ts                       # POST (bulk)
    ├── job-posts/route.ts                                # GET
    ├── job-posts/[id]/route.ts                           # GET, DELETE
    ├── job-posts/[id]/status/route.ts                    # PATCH (approve/reject/stop)
    ├── tien-do-thuc-tap/route.ts                         # GET
    ├── tien-do-thuc-tap/[id]/route.ts                    # GET, PATCH
    └── pending-enterprises/count/route.ts                # GET

lib/
├── constants/
│   ├── admin.ts                                          # ADMIN_DASHBOARD_NAV, TOPBAR_TITLE
│   ├── admin-quan-ly-doanh-nghiep.ts                    # PAGE_SIZE
│   ├── admin-quan-ly-dot-thuc-tap.ts                    # PAGE_SIZE, statusLabel, semesterOptions
│   ├── admin-quan-ly-tai-khoan.ts                       # PAGE_SIZE, roleLabel, statusLabel
│   ├── admin-phan-cong-gvhd.ts                          # PAGE_SIZE, statusLabel, degreeLabel
│   ├── admin-quan-ly-sinh-vien.ts                       # PAGE_SIZE, patterns, degreeLabel, internshipLabel
│   ├── admin-quan-ly-gvhd.ts                            # PAGE_SIZE, patterns, degreeLabel
│   ├── admin-quan-ly-tin-tuyen-dung.ts                  # PAGE_SIZE, statusLabel, workTypeLabel
│   ├── admin-quan-ly-tien-do-thuc-tap.ts                # PAGE_SIZE, internshipStatusLabel, supervisorDegreeLabel
│   ├── admin-students-excel.ts                          # ADMIN_STUDENT_EXCEL_HEADER, sample
│   └── admin-supervisors-excel.ts                       # ADMIN_SUPERVISOR_EXCEL_HEADER, sample
├── types/
│   ├── admin.ts                                         # PendingEnterpriseItem, AdminEnterpriseListItem, AdminEnterpriseDetail
│   ├── admin-dashboard.ts                               # DonutSegment, OverviewPayload, LatestJobItem
│   ├── admin-quan-ly-dot-thuc-tap.ts                    # BatchFormState, InternshipBatchRow
│   ├── admin-quan-ly-tai-khoan.ts                       # Role, AccountStatus, AccountRow
│   ├── admin-phan-cong-gvhd.ts                          # assignment/batch/option types
│   ├── admin-quan-ly-sinh-vien.ts                       # student list/view/form
│   ├── admin-quan-ly-gvhd.ts                            # supervisor list/form
│   ├── admin-quan-ly-tin-tuyen-dung.ts                  # job/batch/status action types
│   └── admin-quan-ly-tien-do-thuc-tap.ts                # ListRow, Detail, statuses
└── utils/
    ├── admin-quan-ly-doanh-nghiep.ts                    # buildAdminEnterprisesListQueryParams
    ├── admin-enterprise-display.ts                      # companyTaxLabel, formatAdminEnterpriseStatusLine
    ├── enterprise-admin-display.ts                      # address/fields formatting, dataUrlFromBase64
    ├── admin-quan-ly-dot-thuc-tap-form.ts               # buildEmptyBatchForm
    ├── admin-quan-ly-dot-thuc-tap-dates.ts              # date helpers for batches
    ├── admin-quan-ly-sinh-vien-form.ts                  # buildEmpty form for student
    ├── admin-quan-ly-sinh-vien-dates.ts                 # birthDate/age helpers
    ├── admin-quan-ly-gvhd-form.ts                       # buildEmpty form for supervisor
    ├── admin-quan-ly-gvhd-dates.ts                      # birthDate helpers
    ├── admin-quan-ly-tai-khoan.ts                       # getAccountViewTitle
    ├── admin-phan-cong-gvhd-display.ts                  # studentDisplay, supervisorDisplay
    ├── admin-quan-ly-tin-tuyen-dung.ts                  # formatDateVi, inferDefaultAction
    └── admin-quan-ly-tien-do-thuc-tap.ts                # supervisorLine
```

---

## 1. Quản lý doanh nghiệp (`/admin/quan-ly-doanh-nghiep`)

### Chức năng
- Xem danh sách doanh nghiệp (lọc theo từ khoá, trạng thái)
- Xem chi tiết hồ sơ doanh nghiệp
- Duyệt / Từ chối đăng ký doanh nghiệp
- Xoá doanh nghiệp

### Trạng thái doanh nghiệp

| Giá trị | Hiển thị | Hành động Admin |
|---------|---------|----------------|
| `PENDING` / `null` | Chờ duyệt | Duyệt / Từ chối |
| `APPROVED` | Đã duyệt | Xem / Xoá |
| `REJECTED` | Đã từ chối | Xem / Xoá |

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-doanh-nghiep/page.tsx<br/>AdminQuanLyDoanhNghiepPage
    participant Toolbar as AdminEnterpriseToolbar.tsx
    participant Table as AdminEnterpriseTable.tsx
    participant ViewPop as AdminEnterpriseViewPopup.tsx
    participant StatusPop as AdminEnterpriseStatusPopup.tsx
    participant ListAPI as api/admin/enterprises/route.ts GET()
    participant DetailAPI as api/admin/enterprises/[id]/route.ts
    participant StatusAPI as api/admin/enterprises/[id]/status/route.ts POST()
    participant DB as Prisma
    participant Mail as lib/mail-enterprise.ts

    Note over Admin,Mail: ── Tải danh sách ──
    Admin->>Page: Mở /admin/quan-ly-doanh-nghiep
    Page->>ListAPI: GET /api/admin/enterprises?q=&status=
    ListAPI->>DB: user.findMany(role=doanhnghiep, filter)
    DB-->>ListAPI: items[]
    ListAPI-->>Page: { success, items[] }
    Page->>Table: Render danh sách

    Note over Admin,Mail: ── Tìm kiếm ──
    Admin->>Toolbar: Nhập q + chọn status → "Tìm kiếm"
    Toolbar->>Page: applySearch()
    Page->>ListAPI: GET với params mới
    ListAPI-->>Page: items[] đã lọc

    Note over Admin,Mail: ── Xem chi tiết ──
    Admin->>Table: Nhấn "Xem chi tiết"
    Table->>Page: openView(row)
    Page->>DetailAPI: GET /api/admin/enterprises/{id}
    DetailAPI->>DB: user.findUnique (+ enterpriseProfile)
    DB-->>DetailAPI: { item }
    DetailAPI-->>Page: detail
    Page->>ViewPop: viewDetail → mở popup

    Note over Admin,Mail: ── Duyệt doanh nghiệp ──
    Admin->>Table: Nhấn "Duyệt"
    Table->>Page: openStatusModal(row)
    Page->>DetailAPI: GET /api/admin/enterprises/{id}
    DetailAPI-->>Page: statusDetail
    Page->>StatusPop: mở popup với action=approve
    Admin->>StatusPop: Nhấn "Xác nhận duyệt"
    StatusPop->>Page: submitApprove()
    Page->>StatusAPI: POST /api/admin/enterprises/{id}/status<br/>{ action: "approve" }
    StatusAPI->>DB: user.findUnique + user.update(enterpriseStatus=APPROVED)
    StatusAPI->>Mail: sendEnterpriseApprovedEmail(user.email, companyName, loginEmail)<br/>lib/mail-enterprise.ts
    StatusAPI-->>Page: { success, message }
    Page->>Page: load() – reload
    Page->>Admin: Toast thành công

    Note over Admin,Mail: ── Từ chối doanh nghiệp ──
    Admin->>StatusPop: Nhấn "Từ chối"
    StatusPop->>Page: startReject()
    Admin->>StatusPop: Nhập lý do từ chối
    StatusPop->>Page: submitReject(reasons[])
    Page->>StatusAPI: POST /api/admin/enterprises/{id}/status<br/>{ action: "reject", reasons: string[] }
    StatusAPI->>DB: user.update(enterpriseStatus=REJECTED)
    StatusAPI->>Mail: sendEnterpriseRejectedEmail(user.email, reasons, companyName)<br/>lib/mail-enterprise.ts
    StatusAPI-->>Page: { success, message, mailError? }
    Page->>Admin: Toast kết quả

    Note over Admin,Mail: ── Xoá doanh nghiệp ──
    Admin->>Table: Nhấn "Xoá"
    Table->>Page: deleteEnterprise(row)
    Page->>DetailAPI: DELETE /api/admin/enterprises/{id}
    DetailAPI->>DB: jobApplication.count (kiểm tra ràng buộc)<br/>jobPost.deleteMany + user.delete
    alt Có dữ liệu ràng buộc
        DetailAPI-->>Page: 409 – thông báo lỗi
    else
        DetailAPI-->>Page: { success, message }
        Page->>Page: load()
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/enterprises` | GET | `user.findMany(role=doanhnghiep)` | Không |
| `/api/admin/enterprises/[id]` | GET | `user.findUnique` (+ `enterpriseProfile`) | Không |
| `/api/admin/enterprises/[id]` | DELETE | `jobApplication.count` + `jobPost.deleteMany` + `user.delete` | Không |
| `/api/admin/enterprises/[id]/status` | POST | `user.findUnique` + `user.update(enterpriseStatus)` | Có: DN (duyệt hoặc từ chối) |

---

## 2. Quản lý đợt thực tập (`/admin/quan-ly-dot-thuc-tap`)

### Chức năng
- Xem danh sách đợt thực tập (lọc theo tên, ngày bắt đầu, ngày kết thúc, trạng thái)
- Thêm mới, chỉnh sửa, xem chi tiết đợt thực tập
- Đóng đợt thực tập (status → CLOSED)
- Xoá đợt thực tập (chỉ khi chưa có tin tuyển dụng liên kết)

### Trạng thái đợt thực tập

| Giá trị | Hiển thị |
|---------|---------|
| `OPEN` | Đang mở |
| `CLOSED` | Đã đóng |

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-dot-thuc-tap/page.tsx<br/>AdminQuanLyDotThucTapPage
    participant ListAPI as api/admin/internship-batches/route.ts
    participant ItemAPI as api/admin/internship-batches/[id]/route.ts
    participant StatusAPI as api/admin/internship-batches/[id]/status/route.ts PATCH()
    participant DB as Prisma

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/internship-batches?q&startDate&endDate&status
    ListAPI->>DB: internshipBatch.updateMany (tự đóng hết hạn)<br/>internshipBatch.findMany
    DB-->>ListAPI: items[]
    ListAPI-->>Page: { success, items[] }

    Note over Admin,DB: ── Thêm đợt thực tập ──
    Admin->>Page: Nhấn "Thêm đợt"
    Page->>Page: startCreate() → form rỗng (buildEmptyBatchForm)
    Admin->>Page: Điền form: Tên, Học kỳ, Năm học, Ngày BĐ, Ngày KT, Ghi chú
    Page->>Page: validateCreate()
    Page->>ListAPI: POST /api/admin/internship-batches<br/>{ name, semester, schoolYear, startDate, endDate, notes }
    ListAPI->>DB: internshipBatch.findFirst (kiểm tra OPEN hiện có)<br/>internshipBatch.create
    DB-->>ListAPI: OK
    ListAPI-->>Page: { success, message }
    Page->>Page: load()

    Note over Admin,DB: ── Chỉnh sửa ──
    Admin->>Page: Nhấn "Sửa"
    Page->>Page: syncFormFromTarget(editTarget)
    Admin->>Page: Cập nhật thông tin
    Page->>Page: validateEdit()
    Page->>ItemAPI: PATCH /api/admin/internship-batches/{id}<br/>{ name, semester, schoolYear, startDate, endDate, notes }
    ItemAPI->>DB: internshipBatch.findUnique + internshipBatch.update
    ItemAPI-->>Page: { success, message\|errors }

    Note over Admin,DB: ── Đóng đợt thực tập ──
    Admin->>Page: Nhấn "Đóng đợt"
    Page->>Page: canClose(item) → kiểm tra status = OPEN
    Admin->>Page: Xác nhận trong StatusPopup
    Page->>StatusAPI: PATCH /api/admin/internship-batches/{id}/status<br/>{ action: "close" }
    StatusAPI->>DB: internshipBatch.findUnique + internshipBatch.update(status=CLOSED)
    StatusAPI-->>Page: { success, message }

    Note over Admin,DB: ── Xoá ──
    Admin->>Page: Nhấn "Xoá"
    Admin->>Page: Xác nhận trong DeletePopup
    Page->>ItemAPI: DELETE /api/admin/internship-batches/{id}
    ItemAPI->>DB: jobPost.count (kiểm tra ràng buộc)<br/>internshipBatch.delete (nếu không có)
    alt Đã có tin tuyển dụng
        ItemAPI-->>Page: 409 – không thể xoá
    else
        ItemAPI-->>Page: { success, message }
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/internship-batches` | GET | `internshipBatch.updateMany` (auto-close) + `findMany` | Không |
| `/api/admin/internship-batches` | POST | `internshipBatch.findFirst(OPEN)` + `internshipBatch.create` | Không |
| `/api/admin/internship-batches/[id]` | GET | `internshipBatch.findUnique` | Không |
| `/api/admin/internship-batches/[id]` | PATCH | `internshipBatch.findUnique` + `internshipBatch.update` | Không |
| `/api/admin/internship-batches/[id]` | DELETE | `jobPost.count` + `internshipBatch.delete` | Không |
| `/api/admin/internship-batches/[id]/status` | PATCH | `internshipBatch.findUnique` + `internshipBatch.update(CLOSED)` | Không |

---

## 3. Quản lý tài khoản (`/admin/quan-ly-tai-khoan`)

### Chức năng
- Xem danh sách tất cả tài khoản (lọc theo từ khoá, role, trạng thái)
- Xem chi tiết tài khoản
- Thay đổi trạng thái tài khoản: `ACTIVE` ↔ `LOCKED`
- Xoá tài khoản

> **Lưu ý quan trọng:** Khi kích hoạt lại (`ACTIVE`) tài khoản sinh viên có `internshipStatus = REJECTED`, hệ thống tự động reset `internshipStatus = NOT_STARTED` trong `$transaction` và tạo `internshipStatusHistory`.

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-tai-khoan/page.tsx<br/>AdminQuanLyTaiKhoanPage
    participant ListAPI as api/admin/accounts/route.ts GET()
    participant DetailAPI as api/admin/accounts/[id]/route.ts
    participant StatusAPI as api/admin/accounts/[id]/status/route.ts PATCH()
    participant DB as Prisma

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/accounts?q=&role=&status=
    ListAPI->>DB: user.findMany (filter by role, status, search)
    DB-->>ListAPI: { success, items[] }
    ListAPI-->>Page: items[]

    Note over Admin,DB: ── Xem chi tiết ──
    Admin->>Page: Nhấn "Xem"
    Page->>DetailAPI: GET /api/admin/accounts/{id}
    DetailAPI->>DB: user.findUnique (+ studentProfile | supervisorProfile | enterpriseProfile)
    DetailAPI-->>Page: { success, item }
    Page->>Page: viewTarget → AdminTaiKhoanViewPopup

    Note over Admin,DB: ── Thay đổi trạng thái ──
    Admin->>Page: Nhấn "Khoá" / "Kích hoạt"
    Page->>Page: openStatus(row) → statusDraft
    Admin->>Page: Xác nhận trong AdminTaiKhoanStatusPopup
    Page->>StatusAPI: PATCH /api/admin/accounts/{id}/status<br/>{ status: "ACTIVE" | "LOCKED" }
    StatusAPI->>DB: user.findUnique (+ studentProfile nếu cần)
    alt Kích hoạt SV có internshipStatus=REJECTED
        StatusAPI->>DB: $transaction:<br/>user.update(status=ACTIVE)<br/>studentProfile.update(internshipStatus=NOT_STARTED)<br/>internshipStatusHistory.create
    else Các trường hợp khác
        StatusAPI->>DB: user.update(status)
    end
    StatusAPI-->>Page: { success, message }
    Page->>Page: load()

    Note over Admin,DB: ── Xoá tài khoản ──
    Admin->>Page: Nhấn "Xoá"
    Admin->>Page: Xác nhận trong AdminTaiKhoanDeletePopup
    Page->>DetailAPI: DELETE /api/admin/accounts/{id}
    DetailAPI->>DB: jobApplication.count (SV) | jobPost.count (DN)<br/>kiểm tra ràng buộc
    alt Có dữ liệu ràng buộc
        DetailAPI-->>Page: 409 – thông báo lỗi
    else
        DetailAPI->>DB: studentProfile.deleteMany | supervisorProfile.deleteMany<br/>user.delete
        DetailAPI-->>Page: { success, message }
    end
```

### API chi tiết

| Route | Method | Prisma | Ghi chú |
|-------|--------|--------|---------|
| `/api/admin/accounts` | GET | `user.findMany` | Lọc theo role, status, search |
| `/api/admin/accounts/[id]` | GET | `user.findUnique` (+ profile tương ứng) | Chi tiết tài khoản |
| `/api/admin/accounts/[id]` | DELETE | `count` + `deleteMany` + `user.delete` | Kiểm tra ràng buộc trước khi xoá |
| `/api/admin/accounts/[id]/status` | PATCH | `user.update` (+ `$transaction` nếu reset SV REJECTED) | Reset internshipStatus nếu SV bị REJECTED được kích hoạt lại |

---

## 4. Phân công GVHD (`/admin/phan-cong-gvhd`)

### Chức năng
- Xem danh sách phân công (lọc theo từ khoá, khoa, trạng thái)
- Thêm phân công mới: chọn Khoa → Đợt thực tập (OPEN) → GVHD (chưa được phân công trong đợt) → nhiều SV (NOT_STARTED / DOING, chưa có GVHD)
- Xem chi tiết phân công
- Xoá phân công
- Gửi email thông báo cho GVHD (danh sách SV) và từng SV (thông tin GVHD)

> **Lưu ý:** Chức năng Sửa phân công đã bị **xoá** — chỉ còn Thêm và Xoá.

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as phan-cong-gvhd/page.tsx<br/>AdminPhanCongGVHDPage
    participant FormPopup as AdminPhanCongGVHDFormPopup.tsx
    participant ListAPI as api/admin/assignments/route.ts
    participant OptionsAPI as api/admin/assignments/options/route.ts GET()
    participant SupAPI as api/admin/assignments/options/supervisors/route.ts GET()
    participant StuAPI as api/admin/assignments/options/students/route.ts GET()
    participant DeleteAPI as api/admin/assignments/[id]/route.ts DELETE()
    participant DB as Prisma
    participant Mail as sendMail()

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/assignments?q=&faculty=&status=
    ListAPI->>DB: supervisorAssignment.findMany (+ supervisorProfile, internshipBatch, students)
    ListAPI->>DB: supervisorProfile.findMany (lấy danh sách khoa)
    DB-->>ListAPI: { success, faculties[], items[] }
    ListAPI-->>Page: items + faculties

    Note over Admin,Mail: ── Thêm phân công ──
    Admin->>Page: Nhấn "Thêm phân công"
    Page->>OptionsAPI: GET /api/admin/assignments/options
    OptionsAPI->>DB: internshipBatch.findMany(OPEN)<br/>supervisorProfile.findMany (lấy faculties)
    OptionsAPI-->>Page: { faculties[], openBatches[] }
    Page->>FormPopup: addOpen = true → mở Popup[Thêm phân công]

    Admin->>FormPopup: Chọn Khoa
    FormPopup->>Page: formFaculty = value

    Admin->>FormPopup: Chọn Đợt thực tập (chỉ OPEN)
    FormPopup->>Page: formBatchId = value
    Page->>SupAPI: GET /api/admin/assignments/options/supervisors<br/>?faculty=&internshipBatchId=&q=
    SupAPI->>DB: supervisorAssignment.findMany (đã phân công trong đợt)<br/>supervisorProfile.findMany (trong khoa, loại đã phân công)
    SupAPI-->>Page: { items: supervisorOptions[] }

    Admin->>FormPopup: Tìm kiếm + chọn GVHD (supervisorQ)
    FormPopup->>Page: formSupervisorId = value
    Page->>StuAPI: GET /api/admin/assignments/options/students<br/>?faculty=&internshipBatchId=&q=
    StuAPI->>DB: supervisorAssignmentStudent.findMany (đã có GVHD trong đợt)<br/>studentProfile.findMany (NOT_STARTED | DOING, chưa có GVHD, cùng khoa)
    StuAPI-->>Page: { items: studentOptions[] }

    Admin->>FormPopup: Tìm kiếm + chọn nhiều SV (studentQ, multi-select)
    Admin->>FormPopup: Nhấn "Tạo"
    FormPopup->>Page: validateForm()
    Page->>ListAPI: POST /api/admin/assignments<br/>{ faculty, internshipBatchId, supervisorProfileId, studentProfileIds[] }
    ListAPI->>DB: internshipBatch.findFirst + supervisorProfile.findFirst<br/>studentProfile.findMany (validate NOT_STARTED | DOING)<br/>$transaction:<br/>  supervisorAssignment.create<br/>  supervisorAssignmentStatusHistory.create<br/>  supervisorAssignmentStudent.createMany
    DB-->>ListAPI: OK
    ListAPI->>Mail: sendMail → GVHD (danh sách SV hướng dẫn + thông tin đợt)
    ListAPI->>Mail: sendMail × N → từng SV (thông tin GVHD: bậc, tên, email, SĐT)
    Note over Mail: Lỗi email không block response
    ListAPI-->>Page: { success, message }
    Page->>Page: loadList() + closeAdd()
    Page->>Admin: Toast "Tạo phân công thành công"

    Note over Admin,Mail: ── Xoá phân công ──
    Admin->>Page: Nhấn "Xoá"
    Admin->>Page: Xác nhận trong AdminPhanCongGVHDDeletePopup
    Page->>DeleteAPI: DELETE /api/admin/assignments/{id}
    DeleteAPI->>DB: supervisorAssignmentStudent.deleteMany<br/>supervisorAssignment.delete
    DeleteAPI-->>Page: { success, message }
    Page->>Page: loadList()
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/assignments` | GET | `supervisorAssignment.findMany` + `supervisorProfile.findMany` | Không |
| `/api/admin/assignments` | POST | `$transaction`: `supervisorAssignment.create` + `supervisorAssignmentStatusHistory.create` + `supervisorAssignmentStudent.createMany` | Có: GVHD + từng SV |
| `/api/admin/assignments/options` | GET | `internshipBatch.findMany(OPEN)` + `supervisorProfile.findMany` | Không |
| `/api/admin/assignments/options/supervisors` | GET | `supervisorAssignment.findMany` + `supervisorProfile.findMany` | Không |
| `/api/admin/assignments/options/students` | GET | `supervisorAssignmentStudent.findMany` + `studentProfile.findMany` | Không |
| `/api/admin/assignments/[id]` | DELETE | `supervisorAssignmentStudent.deleteMany` + `supervisorAssignment.delete` | Không |

### Email gửi khi tạo phân công

| Người nhận | Nội dung |
|-----------|---------|
| GVHD | Danh sách SV được phân công: MSV – Họ tên – Bậc – Lớp + tên đợt thực tập |
| Mỗi SV | Thông tin GVHD: Bậc – Họ tên – Email – SĐT + tên đợt thực tập |

---

## 5. Quản lý sinh viên (`/admin/quan-ly-sinh-vien`)

### Chức năng
- Xem danh sách sinh viên (lọc theo nhiều tiêu chí)
- Thêm SV đơn lẻ hoặc import hàng loạt từ Excel
- Xem chi tiết, chỉnh sửa thông tin SV
- Thay đổi trạng thái tài khoản + trạng thái thực tập
- Xoá SV

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-sinh-vien/page.tsx<br/>AdminQuanLySinhVienPage
    participant ListAPI as api/admin/students/route.ts
    participant ItemAPI as api/admin/students/[id]/route.ts
    participant StatusAPI as api/admin/students/[id]/internship-status/route.ts PATCH()
    participant ImportAPI as api/admin/students/import/route.ts POST()
    participant VNAPI as /api/vn-address/*
    participant DB as Prisma

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/students?q&faculty&degree&status&internshipStatus
    ListAPI->>DB: studentProfile.findMany + jobApplication.findMany
    ListAPI->>DB: faculties (distinct)
    DB-->>ListAPI: { success, items[], faculties[] }

    Note over Admin,DB: ── Thêm đơn lẻ ──
    Admin->>Page: Nhấn "Thêm SV"
    Page->>Page: openAddSingle() → resetForm()
    Admin->>Page: Điền form (họ tên, MSV, lớp, khoa, khóa, bậc, ngày sinh, giới tính, địa chỉ, SĐT, email, MK)
    Page->>VNAPI: GET /api/vn-address/provinces + wards
    Page->>Page: computeValidationErrors()
    Page->>ListAPI: POST /api/admin/students<br/>{ fullName, msv, className, faculty, cohort, degree, birthDate, gender, phone, email, password, address }
    ListAPI->>DB: user.create + studentProfile.create
    ListAPI-->>Page: { success, message\|errors }

    Note over Admin,DB: ── Import hàng loạt ──
    Admin->>Page: Nhấn "Import Excel"
    Page->>Page: openAddBulk() → AdminSinhVienImportPopup
    Admin->>Page: Upload file Excel (downloadExcelTemplate để lấy mẫu)
    Page->>Page: handleImportFile → parse rows[]
    Page->>ImportAPI: POST /api/admin/students/import { rows: [...] }
    ImportAPI->>DB: $transaction: loop user.create + studentProfile.create<br/>(validate duplicate MSV, email)
    ImportAPI-->>Page: { success, message }

    Note over Admin,DB: ── Chỉnh sửa ──
    Admin->>Page: Nhấn "Sửa"
    Page->>ItemAPI: GET /api/admin/students/{id}
    ItemAPI-->>Page: { success, item }
    Page->>Page: openEdit(item) → form từ data
    Admin->>Page: Cập nhật thông tin
    Page->>ItemAPI: PATCH /api/admin/students/{id} { ...fields }
    ItemAPI->>DB: studentProfile.update + user.update
    ItemAPI-->>Page: { success, message\|errors }

    Note over Admin,DB: ── Cập nhật trạng thái thực tập ──
    Admin->>Page: Nhấn "Cập nhật TT thực tập"
    Page->>Page: openStatus(row)
    Admin->>Page: Chọn trạng thái → xác nhận
    Page->>StatusAPI: PATCH /api/admin/students/{id}/internship-status<br/>{ internshipStatus }
    StatusAPI->>DB: studentProfile.update(internshipStatus)
    StatusAPI-->>Page: { success, message }

    Note over Admin,DB: ── Xoá ──
    Admin->>Page: Xác nhận trong DeletePopup
    Page->>ItemAPI: DELETE /api/admin/students/{id}
    ItemAPI->>DB: kiểm tra ràng buộc + studentProfile.deleteMany + user.delete
    ItemAPI-->>Page: { success, message }
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/students` | GET | `studentProfile.findMany` + `jobApplication.findMany` | Không |
| `/api/admin/students` | POST | `user.create` + `studentProfile.create` | Không |
| `/api/admin/students/import` | POST | `$transaction`: loop `user.create` + `studentProfile.create` | Không |
| `/api/admin/students/[id]` | GET | `studentProfile.findFirst` (+ history, report, assignment) | Không |
| `/api/admin/students/[id]` | PATCH | `studentProfile.update` + `user.update` | Không |
| `/api/admin/students/[id]` | DELETE | count checks + `studentProfile.deleteMany` + `user.delete` | Không |
| `/api/admin/students/[id]/internship-status` | PATCH | `studentProfile.update(internshipStatus)` | Không |

---

## 6. Quản lý GVHD (`/admin/quan-ly-gvhd`)

### Chức năng
- Xem danh sách giảng viên (lọc theo từ khoá, khoa, bậc, trạng thái)
- Thêm GVHD đơn lẻ hoặc import hàng loạt từ Excel
- Xem chi tiết, chỉnh sửa thông tin GVHD
- Xoá GVHD

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-gvhd/page.tsx<br/>AdminQuanLyGVHDPage
    participant ListAPI as api/admin/supervisors/route.ts
    participant ItemAPI as api/admin/supervisors/[id]/route.ts
    participant ImportAPI as api/admin/supervisors/import/route.ts POST()
    participant VNAPI as /api/vn-address/*
    participant DB as Prisma

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/supervisors?q&faculty&degree&status
    ListAPI->>DB: supervisorProfile.findMany + faculties distinct
    DB-->>ListAPI: { success, items[], faculties[] }

    Note over Admin,DB: ── Thêm đơn lẻ ──
    Admin->>Page: Nhấn "Thêm GVHD"
    Admin->>Page: Điền form (họ tên, mã GV, khoa, bậc, ngày sinh, giới tính, địa chỉ, SĐT, email, MK)
    Page->>VNAPI: GET provinces + wards
    Page->>ListAPI: POST /api/admin/supervisors<br/>{ fullName, supervisorCode, faculty, degree, birthDate, gender, phone, email, password, address }
    ListAPI->>DB: user.create + supervisorProfile.create
    ListAPI-->>Page: { success, message\|errors }

    Note over Admin,DB: ── Import hàng loạt ──
    Admin->>Page: Upload file Excel
    Page->>ImportAPI: POST /api/admin/supervisors/import { rows: [...] }
    ImportAPI->>DB: $transaction: loop user.create + supervisorProfile.create
    ImportAPI-->>Page: { success, message }

    Note over Admin,DB: ── Chỉnh sửa ──
    Admin->>Page: Nhấn "Sửa"
    Page->>ItemAPI: GET /api/admin/supervisors/{id}
    ItemAPI-->>Page: { success, item }
    Admin->>Page: Cập nhật
    Page->>ItemAPI: PATCH /api/admin/supervisors/{id} { ...fields }
    ItemAPI->>DB: supervisorProfile.update + user.update
    ItemAPI-->>Page: { success, message\|errors }

    Note over Admin,DB: ── Xoá ──
    Admin->>Page: Xác nhận xoá
    Page->>ItemAPI: DELETE /api/admin/supervisors/{id}
    ItemAPI->>DB: kiểm tra ràng buộc<br/>supervisorProfile.deleteMany + user.delete
    ItemAPI-->>Page: { success, message }
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/supervisors` | GET | `supervisorProfile.findMany` | Không |
| `/api/admin/supervisors` | POST | `user.create` + `supervisorProfile.create` | Không |
| `/api/admin/supervisors/import` | POST | `$transaction`: loop `user.create` + `supervisorProfile.create` | Không |
| `/api/admin/supervisors/[id]` | GET | `supervisorProfile.findFirst` (+ `user`) | Không |
| `/api/admin/supervisors/[id]` | PATCH | `supervisorProfile.update` + `user.update` | Không |
| `/api/admin/supervisors/[id]` | DELETE | count checks + `supervisorProfile.deleteMany` + `user.delete` | Không |

---

## 7. Quản lý tin tuyển dụng (`/admin/quan-ly-tin-tuyen-dung`)

### Chức năng
- Xem danh sách tin tuyển dụng (lọc theo tiêu đề/tên DN, đợt thực tập, ngành/khoa, trạng thái)
- Xem chi tiết tin
- Duyệt / Từ chối / Dừng hoạt động tin (kèm email thông báo DN)
- Xoá tin (chỉ khi chưa có ứng viên liên kết)

### Trạng thái & hành động

| Hành động | Trạng thái mới | Email |
|-----------|---------------|-------|
| `approve` | `ACTIVE` | DN: thông báo duyệt thành công |
| `reject` | `REJECTED` | DN: thông báo từ chối + lý do |
| `stop` | `STOPPED` | DN: thông báo dừng hoạt động |

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-tin-tuyen-dung/page.tsx<br/>AdminQuanLyTinTuyenDungPage
    participant Toolbar as AdminTinTuyenDungToolbar.tsx
    participant ListAPI as api/admin/job-posts/route.ts GET()
    participant DetailAPI as api/admin/job-posts/[id]/route.ts
    participant StatusAPI as api/admin/job-posts/[id]/status/route.ts PATCH()
    participant BatchAPI as api/admin/internship-batches/route.ts GET()
    participant DB as Prisma
    participant Mail as sendMail()

    Admin->>Page: Mở trang
    Page->>BatchAPI: GET /api/admin/internship-batches?status=all
    BatchAPI-->>Page: batches[] (cho dropdown đợt thực tập)
    Page->>ListAPI: GET /api/admin/job-posts?q=&batchId=&expertise=&status=
    ListAPI->>DB: jobPost.updateMany (auto-stop hết hạn)<br/>jobPost.findMany (+ enterprise)<br/>jobPost.findMany distinct expertise
    DB-->>ListAPI: { success, items[], expertises[] }
    ListAPI-->>Page: items + expertises (cho dropdown ngành/khoa)

    Note over Admin,Mail: ── Tìm kiếm (Enter hoặc nhấn nút) ──
    Admin->>Toolbar: Nhập q + chọn bộ lọc → Enter / "Tìm kiếm"
    Toolbar->>Page: search()
    Page->>ListAPI: GET với params mới

    Note over Admin,Mail: ── Xem chi tiết ──
    Admin->>Page: Nhấn "Xem"
    Page->>DetailAPI: GET /api/admin/job-posts/{id}
    DetailAPI->>DB: jobPost.findFirst (+ internshipBatch + enterprise user)
    DetailAPI-->>Page: { success, item }
    Page->>Page: viewDetail → AdminTinTuyenDungViewPopup

    Note over Admin,Mail: ── Cập nhật trạng thái ──
    Admin->>Page: Nhấn "Duyệt / Từ chối / Dừng"
    Page->>Page: openStatus(item) → inferDefaultAction(item.status)
    Admin->>Page: Chọn action trong AdminTinTuyenDungStatusPopup
    alt action = reject
        Admin->>Page: Nhập lý do từ chối (bắt buộc)
    end
    Admin->>Page: Nhấn "Lưu"
    Page->>StatusAPI: PATCH /api/admin/job-posts/{id}/status<br/>{ action: "approve"|"reject"|"stop", rejectionReason? }
    StatusAPI->>DB: jobPost.findFirst (+ enterpriseUser.email)<br/>jobPost.update(status)
    alt action = approve
        StatusAPI->>Mail: sendMail → DN (tin đã được duyệt)
    else action = reject
        StatusAPI->>Mail: sendMail → DN (tin bị từ chối + lý do)
    else action = stop
        StatusAPI->>Mail: sendMail → DN (tin bị dừng hoạt động)
    end
    StatusAPI-->>Page: { success, message }
    Page->>Page: load()

    Note over Admin,Mail: ── Xoá tin ──
    Admin->>Page: Nhấn "Xoá"
    Admin->>Page: Xác nhận trong AdminTinTuyenDungDeletePopup
    Page->>DetailAPI: DELETE /api/admin/job-posts/{id}
    DetailAPI->>DB: jobApplication.count (kiểm tra ràng buộc)
    alt Đã có ứng viên
        DetailAPI-->>Page: 409 – "Không thể xoá, đã có dữ liệu liên kết"
    else
        DetailAPI->>DB: jobPost.delete
        DetailAPI-->>Page: { success, message }
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/job-posts` | GET | `jobPost.updateMany` (auto-stop) + `jobPost.findMany` + distinct `expertise` | Không |
| `/api/admin/job-posts/[id]` | GET | `jobPost.findFirst` (+ `internshipBatch` + enterprise) | Không |
| `/api/admin/job-posts/[id]` | DELETE | `jobApplication.count` + `jobPost.delete` | Không |
| `/api/admin/job-posts/[id]/status` | PATCH | `jobPost.findFirst` + `jobPost.update(status)` | Có: DN (approve/reject/stop) |

---

## 8. Quản lý tiến độ thực tập (`/admin/quan-ly-tien-do-thuc-tap`)

### Chức năng
- Xem danh sách SV với trạng thái thực tập (lọc theo từ khoá, khoa, bậc, trạng thái)
- Xem chi tiết tiến độ: thông tin SV, GVHD, DN, lịch sử trạng thái, BCTT, điểm
- Cập nhật trạng thái thực tập cuối cùng: `COMPLETED` hoặc `REJECTED` (Chưa hoàn thành)

### Luồng cập nhật trạng thái cuối cùng

```
finalStatus = COMPLETED:
  → studentProfile.internshipStatus = COMPLETED
  → supervisorAssignment.status = COMPLETED (Hoàn thành hướng dẫn)
  → supervisorAssignmentStatusHistory.create
  → internshipStatusHistory.create
  → sendMail → SV (thông báo hoàn thành + kết quả)
  → sendMail → GVHD (thông báo hoàn thành hướng dẫn)

finalStatus = REJECTED (Chưa hoàn thành thực tập):
  → studentProfile.internshipStatus = REJECTED
  → supervisorAssignment.status = COMPLETED (vẫn hoàn thành hướng dẫn)
  → internshipStatusHistory.create
  → user.update(status = LOCKED) — khoá tài khoản SV
  → sendMail → SV (thông báo chưa hoàn thành)
```

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as quan-ly-tien-do-thuc-tap/page.tsx<br/>AdminTienDoThucTapPage
    participant Toolbar as AdminTienDoToolbar.tsx
    participant Table as AdminTienDoTableSection.tsx
    participant ViewPop as AdminTienDoViewPopup.tsx
    participant EditModal as AdminTienDoEditModal.tsx
    participant ListAPI as api/admin/tien-do-thuc-tap/route.ts GET()
    participant DetailAPI as api/admin/tien-do-thuc-tap/[id]/route.ts
    participant DB as Prisma
    participant Mail as sendMail()

    Admin->>Page: Mở trang
    Page->>ListAPI: GET /api/admin/tien-do-thuc-tap?q=&faculty=&degree=&status=
    ListAPI->>DB: studentProfile.findMany (+ supervisorAssignment, internshipReport, user)<br/>faculties distinct
    DB-->>ListAPI: { success, items[], faculties[], degreeLabel }
    ListAPI-->>Page: items + faculties

    Note over Admin,Mail: ── Tìm kiếm ──
    Admin->>Toolbar: Nhập q + chọn bộ lọc → "Tìm kiếm"
    Toolbar->>Page: onSearch(filters)
    Page->>ListAPI: GET với params mới

    Note over Admin,Mail: ── Xem chi tiết ──
    Admin->>Table: Nhấn "Xem"
    Table->>Page: openView(row)
    Page->>DetailAPI: GET /api/admin/tien-do-thuc-tap/{studentProfileId}
    DetailAPI->>DB: studentProfile (heavy select):<br/>  user (tên, email, SĐT)<br/>  supervisorAssignment → supervisorProfile (bậc, SĐT, email)<br/>  internshipStatusHistory[]<br/>  internshipReport (file, dqtPoint, kthpPoint, evaluation)<br/>jobApplication.findFirst (tên DN, MST, địa chỉ, vị trí nếu DOING)
    DB-->>DetailAPI: { success, item }
    DetailAPI-->>Page: detail
    Page->>ViewPop: viewTarget → mở popup
    ViewPop->>Admin: MSV, Họ tên, Lớp, Khoa, Khóa, Bậc<br/>GVHD: Bậc-SĐT-Email<br/>DN + vị trí (nếu DOING)<br/>File BCTT + điểm + đánh giá (nếu có)<br/>Nhật ký thay đổi trạng thái

    Note over Admin,Mail: ── Cập nhật trạng thái thực tập cuối cùng ──
    Admin->>Table: Nhấn "Cập nhật trạng thái" (canFinalUpdate = true)
    Table->>Page: openEdit(row)
    Page->>DetailAPI: GET /api/admin/tien-do-thuc-tap/{id} (load detail cho modal)
    DetailAPI-->>Page: detail
    Page->>EditModal: editTarget + editDetail → mở Popup[Cập nhật TT cuối cùng]
    EditModal->>Admin: MSV, Họ tên, Lớp, Khoa, Khóa, Bậc, GVHD<br/>File BCTT (Xem inline, không ép tải) + điểm (nếu có)<br/>Dropdown: Hoàn thành / Chưa hoàn thành

    Admin->>EditModal: Chọn finalStatus → "Lưu"
    EditModal->>Page: submitEdit()
    Page->>DetailAPI: PATCH /api/admin/tien-do-thuc-tap/{studentProfileId}<br/>{ finalStatus: "COMPLETED" | "REJECTED" }

    DetailAPI->>DB: studentProfile.findFirst (+ supervisorAssignment)
    alt finalStatus = COMPLETED
        DetailAPI->>DB: $transaction:<br/>studentProfile.update(internshipStatus=COMPLETED)<br/>supervisorAssignment.update(status=COMPLETED)<br/>supervisorAssignmentStatusHistory.create<br/>internshipStatusHistory.create
        DetailAPI->>Mail: sendMail → SV (hoàn thành thực tập + kết quả)
        DetailAPI->>Mail: sendMail → GVHD (hoàn thành hướng dẫn)
    else finalStatus = REJECTED
        DetailAPI->>DB: $transaction:<br/>studentProfile.update(internshipStatus=REJECTED)<br/>supervisorAssignment.update(status=COMPLETED)<br/>internshipStatusHistory.create<br/>user.update(status=LOCKED)
        DetailAPI->>Mail: sendMail → SV (chưa hoàn thành thực tập)
    end
    Note over Mail: Lỗi email không block response
    DetailAPI-->>Page: { success, message }
    Page->>Page: load()
    Page->>Admin: Toast kết quả
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/admin/tien-do-thuc-tap` | GET | `studentProfile.findMany` (+ assignments, reports, user) + distinct `faculties` | Không |
| `/api/admin/tien-do-thuc-tap/[id]` | GET | `studentProfile` (heavy select) + `jobApplication.findFirst` | Không |
| `/api/admin/tien-do-thuc-tap/[id]` | PATCH | `$transaction`: `studentProfile.update` + `supervisorAssignment.update` + `statusHistory.create` + (REJECTED) `user.update(LOCKED)` | Có: SV + GVHD (nếu COMPLETED); SV (nếu REJECTED) |
| `/api/files/internship-report/[id]` | GET | `internshipReport.findFirst` + kiểm tra quyền (`admin/giangvien/sinhvien`) | Không |

### Email gửi khi cập nhật trạng thái cuối cùng

| Điều kiện | Người nhận | Nội dung |
|-----------|-----------|---------|
| `COMPLETED` | SV | Thông báo hoàn thành thực tập, kết quả (điểm ĐQT/KTHP, đánh giá) |
| `COMPLETED` | GVHD | Thông báo hoàn thành hướng dẫn thực tập cho SV |
| `REJECTED` | SV | Thông báo chưa hoàn thành thực tập, tài khoản bị khoá |

---

## Dashboard (`/admin/dashboard`)

### Chức năng
- Biểu đồ tổng quan: phân bố trạng thái thực tập, tiến độ theo khoa, xu hướng theo thời gian
- Lọc theo Khoa và Đợt thực tập

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor Admin
    participant Page as admin/dashboard/page.tsx<br/>AdminDashboardPage
    participant Charts as AdminDashboardCharts.tsx<br/>(DonutChart, BarChart, ProgressColumnChart, LineChart, TopFieldsCard)
    participant API as api/admin/dashboard/overview/route.ts GET()
    participant DB as Prisma

    Admin->>Page: Mở /admin/dashboard
    Page->>API: GET /api/admin/dashboard/overview?faculty=&batchId=
    API->>DB: studentProfile (internshipStatus counts)<br/>internshipBatch (danh sách đợt)<br/>jobApplication (counts theo status)<br/>jobPost (latestJobs)
    DB-->>API: OverviewPayload
    API-->>Page: { success, payload }
    Page->>Charts: Render DonutChart, BarChart, ProgressColumnChart, LineChart, TopFieldsCard

    Admin->>Page: Thay đổi Khoa / Đợt thực tập
    Page->>API: GET với faculty=&batchId= mới
    API-->>Page: payload mới
    Page->>Charts: Re-render
```

---

## Tổng hợp API toàn module

| API Route | Method | Email | Ghi chú |
|-----------|--------|-------|---------|
| `/api/admin/dashboard/overview` | GET | — | Charts data |
| `/api/admin/enterprises` | GET | — | Danh sách DN |
| `/api/admin/enterprises/[id]` | GET, DELETE | — | Chi tiết + xoá |
| `/api/admin/enterprises/[id]/status` | POST | Có (DN) | Duyệt / từ chối |
| `/api/admin/internship-batches` | GET, POST | — | Đợt thực tập |
| `/api/admin/internship-batches/[id]` | GET, PATCH, DELETE | — | Chi tiết + sửa + xoá |
| `/api/admin/internship-batches/[id]/status` | PATCH | — | Đóng đợt |
| `/api/admin/accounts` | GET | — | Tất cả tài khoản |
| `/api/admin/accounts/[id]` | GET, DELETE | — | Chi tiết + xoá |
| `/api/admin/accounts/[id]/status` | PATCH | — | Khoá/kích hoạt + reset internshipStatus |
| `/api/admin/assignments` | GET, POST | Có (GV + SV) | Phân công + email |
| `/api/admin/assignments/[id]` | GET, DELETE | — | Chi tiết + xoá |
| `/api/admin/assignments/options` | GET | — | Faculties + openBatches |
| `/api/admin/assignments/options/supervisors` | GET | — | GV chưa phân công |
| `/api/admin/assignments/options/students` | GET | — | SV chưa có GVHD |
| `/api/admin/students` | GET, POST | — | Danh sách + thêm mới |
| `/api/admin/students/import` | POST | — | Import bulk từ Excel |
| `/api/admin/students/[id]` | GET, PATCH, DELETE | — | Chi tiết + sửa + xoá |
| `/api/admin/students/[id]/internship-status` | PATCH | — | Cập nhật TT thực tập |
| `/api/admin/supervisors` | GET, POST | — | Danh sách + thêm mới |
| `/api/admin/supervisors/import` | POST | — | Import bulk từ Excel |
| `/api/admin/supervisors/[id]` | GET, PATCH, DELETE | — | Chi tiết + sửa + xoá |
| `/api/admin/job-posts` | GET | — | Danh sách tin + auto-stop + expertises |
| `/api/admin/job-posts/[id]` | GET, DELETE | — | Chi tiết + xoá |
| `/api/admin/job-posts/[id]/status` | PATCH | Có (DN) | Duyệt/từ chối/dừng |
| `/api/admin/tien-do-thuc-tap` | GET | — | Danh sách SV + tiến độ |
| `/api/admin/tien-do-thuc-tap/[id]` | GET, PATCH | Có (SV + GVHD) | Chi tiết + cập nhật cuối |
| `/api/files/internship-report/[id]` | GET | — | Xem/tải file BCTT theo quyền (mặc định inline) |
| `/api/admin/pending-enterprises/count` | GET | — | Số DN chờ duyệt (badge) |
