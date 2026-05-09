# Module Doanh nghiệp

---

## Bảng tổng quan

| Module | Route | API chính | Email |
|--------|-------|-----------|-------|
| Tài khoản | `/doanhnghiep/tai-khoan` | `/api/doanhnghiep/me` | Không |
| Quản lý tin tuyển dụng | `/doanhnghiep/tuyen-dung` | `/api/doanhnghiep/tuyen-dung` | Không |
| Quản lý ứng viên | `/doanhnghiep/ung-vien` | `/api/doanhnghiep/ung-vien` | Có (SV) |
| Đổi mật khẩu | `/auth/doimatkhau` | `/api/auth/change-password` | Không |
| Dashboard | `/doanhnghiep/dashboard` | `/api/doanhnghiep/dashboard/overview` | Không |

### Ghi chú hiệu năng
- DashboardShell bỏ cơ chế reload toàn trang sau mutation để giảm thời gian chờ khi tạo/sửa/xóa.
- API search doanh nghiệp đã giới hạn query ngắn: `contains` chỉ chạy khi `q.length >= 2` (ví dụ `tuyen-dung`, `ung-vien`).

---

## Tech Stack & cấu trúc thư mục

```
app/
├── doanhnghiep/
│   ├── layout.tsx                                    # DoanhnghiepLayout – DashboardShell role="doanhnghiep"
│   ├── dashboard/
│   │   ├── page.tsx                                  # EnterpriseDashboardPage
│   │   └── components/
│   │       ├── EnterpriseDashboardStats.tsx
│   │       └── EnterpriseDashboardTasks.tsx
│   ├── tai-khoan/
│   │   ├── page.tsx                                  # EnterpriseAccountPage
│   │   └── components/
│   │       ├── EnterpriseProfileInfo.tsx             # Thông tin đọc (read-only)
│   │       └── EnterpriseAccountEditSection.tsx      # Form chỉnh sửa
│   ├── tuyen-dung/
│   │   ├── page.tsx                                  # DoanhNghiepTuyenDungPage
│   │   └── components/
│   │       ├── TuyenDungToolbar.tsx
│   │       ├── TuyenDungTableSection.tsx
│   │       ├── TuyenDungViewPopup.tsx
│   │       ├── TuyenDungAddPopup.tsx
│   │       ├── TuyenDungEditPopup.tsx
│   │       ├── TuyenDungStopPopup.tsx
│   │       ├── TuyenDungDeletePopup.tsx
│   │       └── TuyenDungJobFormFields.tsx            # Form fields dùng chung Add/Edit
│   └── ung-vien/
│       ├── page.tsx                                  # DoanhNghiepUngVienPage (danh sách)
│       ├── components/
│       │   ├── UngVienToolbar.tsx
│       │   └── UngVienTableSection.tsx
│       └── [id]/
│           ├── page.tsx                              # DoanhNghiepUngVienDetailPage (chi tiết)
│           └── components/
│               ├── JobDetailInfo.tsx
│               ├── ApplicantTableSection.tsx
│               └── ApplicantDetailPopup.tsx          # type Props exported
│
├── auth/doimatkhau/
│   ├── page.tsx                                      # ChangePasswordPage
│   └── components/ChangePasswordFormCard.tsx
│
└── api/doanhnghiep/
    ├── me/route.ts                                   # GET, PATCH
    ├── dashboard/overview/route.ts                   # GET
    ├── tuyen-dung/route.ts                           # GET, POST
    ├── tuyen-dung/open-batch/route.ts                # GET
    ├── tuyen-dung/[id]/route.ts                      # GET, PATCH, DELETE
    ├── tuyen-dung/[id]/status/route.ts               # PATCH (dừng hoạt động)
    ├── ung-vien/route.ts                             # GET (danh sách job + applicantCount)
    ├── ung-vien/[id]/route.ts                        # GET (chi tiết job + danh sách ứng viên)
    └── ung-vien/applications/[id]/route.ts           # PATCH (cập nhật trạng thái ứng viên)

lib/
├── constants/
│   ├── doanhnghiep.ts                               # NAV, TOPBAR_TITLE, BUSINESS_FIELD_OPTIONS, regex
│   ├── doanhnghiep-dashboard.ts                     # ENTERPRISE_DASHBOARD_OVERVIEW_ENDPOINT
│   ├── doanhnghiep-tai-khoan.ts                     # ENTERPRISE_ACCOUNT_ME_ENDPOINT, EMPTY_FORM, messages
│   ├── doanhnghiep-tuyen-dung.ts                    # PAGE_SIZE, statusLabel, workTypeLabel, validation
│   ├── doanhnghiep-ung-vien.ts                      # ENDPOINT, PAGE_SIZE, STATUS_LABEL
│   └── doanhnghiep-ung-vien-detail.ts               # applicationStatusLabel/Color, responseLabel, degreeLabel
├── types/
│   ├── doanhnghiep-dashboard.ts                     # EnterpriseDashboardItem, OverviewResponse
│   ├── doanhnghiep-tai-khoan.ts                     # ApiResponse<T>, EnterpriseAccountFormState
│   ├── doanhnghiep-tuyen-dung.ts                    # JobStatus, WorkType, JobListItem, JobFormState
│   ├── doanhnghiep-ung-vien.ts                      # JobStatus, JobRow
│   └── doanhnghiep-ung-vien-detail.ts               # JobApplicationStatus, Applicant, JobDetail, getAvailableNextStatuses()
└── utils/
    ├── doanhnghiep-dashboard.ts                     # fetchEnterpriseDashboardOverview
    ├── doanhnghiep-tai-khoan.ts                     # mapFormFromMe, validateForm, buildPatchPayload
    ├── doanhnghiep-tuyen-dung.ts                    # buildEmptyJobFormState, validateJobForm, buildCreatePayload, canStopStatus
    ├── doanhnghiep-ung-vien.ts                      # buildDoanhNghiepUngVienListUrl, formatDateVi
    └── doanhnghiep-ung-vien-detail.ts               # formatDateTimeVi, formatDateVi
```

---

## 1. Tài khoản (`/doanhnghiep/tai-khoan`)

### Chức năng
- Xem thông tin doanh nghiệp: tên công ty, MST, lĩnh vực kinh doanh, địa chỉ trụ sở, website, người đại diện, chức danh
- Chỉnh sửa: tên người đại diện, chức danh, **giới thiệu về doanh nghiệp** (textarea), website
- File giấy phép + logo ưu tiên lấy từ Cloudinary (`businessLicensePublicId` / `companyLogoPublicId`), fallback dữ liệu cũ base64 nếu còn

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    participant Page as doanhnghiep/tai-khoan/page.tsx<br/>EnterpriseAccountPage
    participant ProfileInfo as EnterpriseProfileInfo.tsx
    participant EditSection as EnterpriseAccountEditSection.tsx
    participant API as api/doanhnghiep/me/route.ts
    participant DB as Prisma

    Note over DN,DB: ── Tải trang ──
    DN->>Page: Mở /doanhnghiep/tai-khoan
    Page->>API: GET /api/doanhnghiep/me
    API->>DB: user.findUnique (enterpriseProfile: tên, MST, địa chỉ,<br/>website, người đại diện, chức danh, lĩnh vực)
    DB-->>API: enterprise user record
    API-->>Page: { success, item: me }
    Page->>ProfileInfo: Props: me (tên, MST, địa chỉ, lĩnh vực, ...)
    Page->>EditSection: Props: me + form state (read-only mode)

    Note over DN,DB: ── Chỉnh sửa tài khoản ──
    DN->>Page: Nhấn "Chỉnh sửa"
    Page->>Page: startEdit() → isEditing = true<br/>mapEnterpriseAccountFormFromMe(me)
    Page->>EditSection: isEditing = true → hiện form
    DN->>EditSection: Sửa người đại diện / chức danh / giới thiệu DN / website
    EditSection->>Page: setField(key, value)

    DN->>EditSection: Nhấn "Lưu"
    Page->>Page: validate() [lib/utils/doanhnghiep-tai-khoan.ts]
    alt Hợp lệ
        Page->>API: PATCH /api/doanhnghiep/me<br/>{ representativeName, representativeTitle, companyIntro, website }
        API->>DB: user.findUnique (verify session)<br/>user.update (enterpriseProfile fields)
        DB-->>API: OK
        API-->>Page: { success, message }
        Page->>Page: reloadMe() → GET /api/doanhnghiep/me
        Page->>DN: Toast thành công, isEditing = false
    else Lỗi validation
        Page->>DN: Hiển thị fieldErrors
    end

    Note over DN,DB: ── Huỷ chỉnh sửa ──
    DN->>Page: Nhấn "Huỷ"
    Page->>Page: cancelEdit() → khôi phục form từ me
    Page->>DN: isEditing = false
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/doanhnghiep/me` | GET | `user.findUnique` (+ `enterpriseProfile`) | `{ success, item: enterprise fields }` |
| `/api/doanhnghiep/me` | PATCH | `user.findUnique` + `user.update(enterpriseProfile)` | `{ success, message }` hoặc `{ success: false, field, message }` |

### Ghi chú hiệu năng
- Các popup lớn ở trang doanh nghiệp đã được lazy-load (dynamic import) để giảm thời gian click/mở popup.

---

## 2. Quản lý tin tuyển dụng (`/doanhnghiep/tuyen-dung`)

### Chức năng
- Xem danh sách tin tuyển dụng của DN: tiêu đề, ngày đăng, hạn tuyển dụng, trạng thái
- Tìm kiếm theo: từ khoá, ngày đăng, trạng thái
- Thêm mới tin tuyển dụng (yêu cầu có đợt thực tập đang mở)
- Xem chi tiết, chỉnh sửa tin (khi đang ở trạng thái cho phép)
- Dừng hoạt động tin
- Xoá tin (khi chưa có ứng viên)
- Chọn **Ngành/Khoa (allowedFaculties)** cho tin: chỉ SV thuộc khoa được chọn mới thấy tin (rỗng → SV nào cũng thấy)

### Trạng thái tin tuyển dụng (`JobStatus`)

| Giá trị | Hiển thị | Cho phép chỉnh sửa | Cho phép dừng |
|---------|---------|---------------------|---------------|
| `PENDING` | Chờ duyệt | Có | Có |
| `ACTIVE` | Đang hoạt động | Có | Có |
| `REJECTED` | Từ chối duyệt | Có | Có |
| `STOPPED` | Dừng hoạt động | Không | Không |

> **Auto-stop:** API GET `/api/doanhnghiep/tuyen-dung` tự động gọi `jobPost.updateMany` để dừng các tin đã hết hạn (`deadline < now` và status `ACTIVE`).

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    participant Page as doanhnghiep/tuyen-dung/page.tsx<br/>DoanhNghiepTuyenDungPage
    participant Toolbar as TuyenDungToolbar.tsx
    participant Table as TuyenDungTableSection.tsx
    participant ViewPop as TuyenDungViewPopup.tsx
    participant AddPop as TuyenDungAddPopup.tsx
    participant EditPop as TuyenDungEditPopup.tsx
    participant StopPop as TuyenDungStopPopup.tsx
    participant DelPop as TuyenDungDeletePopup.tsx
    participant ListAPI as api/doanhnghiep/tuyen-dung/route.ts
    participant DetailAPI as api/doanhnghiep/tuyen-dung/[id]/route.ts
    participant StatusAPI as api/doanhnghiep/tuyen-dung/[id]/status/route.ts PATCH()
    participant BatchAPI as api/doanhnghiep/tuyen-dung/open-batch/route.ts GET()
    participant MeAPI as api/doanhnghiep/me/route.ts GET()
    participant DB as Prisma

    Note over DN,DB: ── Tải trang ──
    DN->>Page: Mở /doanhnghiep/tuyen-dung
    Page->>ListAPI: GET /api/doanhnghiep/tuyen-dung?q=&date=&status=
    ListAPI->>DB: jobPost.updateMany (auto-stop hết hạn)<br/>jobPost.findMany (theo enterprise user)
    DB-->>ListAPI: items[]
    ListAPI-->>Page: { success, items[] }
    Page->>Table: Render danh sách

    Note over DN,DB: ── Tìm kiếm ──
    DN->>Toolbar: Nhập từ khoá + ngày + trạng thái → "Tìm kiếm"
    Toolbar->>Page: onSearch({ q, date, status })
    Page->>ListAPI: GET ?q=...&date=...&status=...
    ListAPI-->>Page: items[] đã lọc

    Note over DN,DB: ── Xem chi tiết ──
    DN->>Table: Nhấn "Xem chi tiết"
    Table->>Page: openView(id)
    Page->>DetailAPI: GET /api/doanhnghiep/tuyen-dung/{id}
    DetailAPI->>DB: jobPost.findFirst (+ internshipBatch) + user (enterprise info)
    DB-->>DetailAPI: { job, enterprise }
    DetailAPI-->>Page: { success, item }
    Page->>ViewPop: viewJob → mở popup chi tiết

    Note over DN,DB: ── Thêm tin tuyển dụng ──
    DN->>Page: Nhấn "Thêm tin"
    Page->>BatchAPI: GET /api/doanhnghiep/tuyen-dung/open-batch
    BatchAPI->>DB: internshipBatch.updateMany (đóng đợt hết hạn)<br/>internshipBatch.findFirst(OPEN)
    DB-->>BatchAPI: { hasOpenBatch, batchId }
    alt Không có đợt thực tập mở
        Page->>DN: Thông báo "Không có đợt thực tập đang mở"
    else Có đợt mở
        Page->>MeAPI: GET /api/doanhnghiep/me (lấy defaults: intro, website)
        MeAPI-->>Page: me
        Page->>Page: resetFormForAdd() → buildJobFormForAdd(me)
        Page->>AddPop: addOpen = true → mở popup
        DN->>AddPop: Điền thông tin tin tuyển dụng
        Note over AddPop: Field "Vị trí tuyển dụng" (thay cho "Chuyên môn")<br/>Multi-select combobox "Ngành/Khoa" → allowedFaculties[]
        Page->>Page: validateForm() [lib/utils/doanhnghiep-tuyen-dung.ts]
        Page->>ListAPI: POST /api/doanhnghiep/tuyen-dung<br/>buildJobCreatePayload(form)
        ListAPI->>DB: user.findUnique + internshipBatch.findFirst(OPEN)<br/>jobPost.create
        DB-->>ListAPI: OK
        ListAPI-->>Page: { success, message }
        Page->>Page: refresh() – reload danh sách
        Page->>DN: Toast thành công
    end

    Note over DN,DB: ── Chỉnh sửa tin ──
    DN->>Table: Nhấn "Chỉnh sửa" (canEditStatus = true)
    Table->>Page: openEdit(item)
    Page->>DetailAPI: GET /api/doanhnghiep/tuyen-dung/{id}
    DetailAPI-->>Page: { item } với đầy đủ fields
    Page->>Page: resetFormForEdit(detail)
    Page->>EditPop: editTarget + editDetail → mở popup
    DN->>EditPop: Cập nhật thông tin
    Page->>Page: validateForm()
    Page->>DetailAPI: PATCH /api/doanhnghiep/tuyen-dung/{id}<br/>buildJobEditPayload(form)
    DetailAPI->>DB: jobPost.findFirst + user.findUnique + jobPost.update
    DB-->>DetailAPI: OK
    DetailAPI-->>Page: { success, message }
    Page->>Page: refresh()
    Page->>DN: Toast thành công

    Note over DN,DB: ── Dừng hoạt động ──
    DN->>Table: Nhấn "Dừng" (canStopStatus = true)
    Table->>Page: stopTarget = item
    Page->>StopPop: stopTarget → confirm popup
    DN->>StopPop: Xác nhận
    StopPop->>Page: doStop()
    Page->>StatusAPI: PATCH /api/doanhnghiep/tuyen-dung/{id}/status<br/>{ action: "stop" }
    StatusAPI->>DB: jobPost.findFirst + jobPost.update(status=STOPPED, stoppedAt)
    DB-->>StatusAPI: OK
    StatusAPI-->>Page: { success, message }
    Page->>Page: refresh()

    Note over DN,DB: ── Xoá tin ──
    DN->>Table: Nhấn "Xoá"
    Table->>Page: deleteTarget = item
    Page->>DelPop: deleteTarget → confirm popup
    DN->>DelPop: Xác nhận
    DelPop->>Page: doDelete()
    Page->>DetailAPI: DELETE /api/doanhnghiep/tuyen-dung/{id}
    DetailAPI->>DB: jobPost.findFirst + jobApplication.count
    alt Đã có ứng viên
        DetailAPI-->>Page: 409 – "Không thể xoá, đã có ứng viên"
        Page->>DN: Thông báo lỗi
    else Chưa có ứng viên
        DetailAPI->>DB: jobPost.delete
        DetailAPI-->>Page: { success, message }
        Page->>Page: refresh()
        Page->>DN: Toast thành công
    end
```

### API chi tiết

| Route | Method | Body / Query | Prisma | Email |
|-------|--------|-------------|--------|-------|
| `/api/doanhnghiep/tuyen-dung` | GET | `?q, date, status` | `jobPost.updateMany` (auto-stop) + `jobPost.findMany` | Không |
| `/api/doanhnghiep/tuyen-dung` | POST | `buildJobCreatePayload(form)` | `user.findUnique` + `internshipBatch.findFirst(OPEN)` + `jobPost.create` | Không |
| `/api/doanhnghiep/tuyen-dung/open-batch` | GET | — | `internshipBatch.updateMany` + `internshipBatch.findFirst(OPEN)` | Không |
| `/api/doanhnghiep/tuyen-dung/[id]` | GET | — | `jobPost.updateMany` + `jobPost.findFirst` + `user.findUnique` | Không |
| `/api/doanhnghiep/tuyen-dung/[id]` | PATCH | `buildJobEditPayload(form)` | `jobPost.findFirst` + `user.findUnique` + `jobPost.update` | Không |
| `/api/doanhnghiep/tuyen-dung/[id]` | DELETE | — | `jobPost.findFirst` + `jobApplication.count` + `jobPost.delete` | Không |
| `/api/doanhnghiep/tuyen-dung/[id]/status` | PATCH | `{ action: "stop" }` | `jobPost.findFirst` + `jobPost.update(STOPPED, stoppedAt)` | Không |

---

## 3. Quản lý ứng viên (`/doanhnghiep/ung-vien`)

### Chức năng
- **Trang danh sách:** xem tất cả tin tuyển dụng kèm số lượng ứng viên đã nộp hồ sơ
- **Trang chi tiết (`/ung-vien/[id]`):** xem chi tiết tin + danh sách ứng viên đã nộp hồ sơ
- **Popup[Xem chi tiết ứng viên]:** thông tin SV + lịch sử phản hồi + cập nhật trạng thái phản hồi
- **Điều kiện cập nhật:** chỉ khi `internshipStatus = NOT_STARTED` của SV; nếu đã có nơi thực tập → hiển thị thông báo

### Trạng thái ứng viên & luồng phản hồi

```
JobApplicationStatus      Người cập nhật   Trạng thái tiếp theo được phép
─────────────────────     ──────────────   ────────────────────────────────────────────
PENDING                   DN               INTERVIEW_INVITED | OFFERED | REJECTED
INTERVIEW_INVITED         SV (qua email)   → STUDENT_CONFIRMED_INTERVIEW (SV xác nhận)
                                           → STUDENT_DECLINED_INTERVIEW  (SV từ chối)
STUDENT_CONFIRMED_INTER.  DN               OFFERED | REJECTED
STUDENT_DECLINED_INTER.   —                Khoá (không cập nhật tiếp)
OFFERED                   SV (qua email)   → STUDENT_CONFIRMED_OFFER (SV xác nhận → internshipStatus=DOING)
                                           → STUDENT_DECLINED_OFFER  (SV từ chối)
STUDENT_CONFIRMED_OFFER   —                Khoá (SV đã có nơi thực tập)
STUDENT_DECLINED_OFFER    —                Khoá
REJECTED                  —                Khoá
```

> **Lazy auto-decline:** GET `/api/doanhnghiep/ung-vien/[id]` kiểm tra `responseDeadline` đã qua → tự động cập nhật `PENDING` → `STUDENT_DECLINED` nếu deadline hết.

> **Token email links:** khi DN cập nhật `INTERVIEW_INVITED` hoặc `OFFERED`, hệ thống ký JWT `signRespondToken()` (`lib/utils/respond-token.ts`), nhúng vào link `/api/respond?token=...` trong email gửi cho SV.

### Nội dung Popup[Xem chi tiết ứng viên]

- Họ tên, Bậc, SĐT, Email, Địa chỉ hiện tại
- Thư giới thiệu bản thân, File CV đính kèm
- Lịch sử phản hồi giữa DN và SV
- Nếu `internshipStatus ≠ NOT_STARTED` → text "Sinh viên đã có nơi thực tập" (chặn cập nhật)
- Nếu `internshipStatus = NOT_STARTED` → dropdown cập nhật trạng thái + form theo trạng thái:
  - `INTERVIEW_INVITED`: thêm trường thời gian PV, địa điểm PV, thời hạn phản hồi
  - `OFFERED`: thêm trường thời hạn phản hồi

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    actor SV as Sinh viên
    participant ListPage as doanhnghiep/ung-vien/page.tsx<br/>DoanhNghiepUngVienPage
    participant Toolbar as UngVienToolbar.tsx
    participant ListTable as UngVienTableSection.tsx
    participant DetailPage as doanhnghiep/ung-vien/[id]/page.tsx<br/>DoanhNghiepUngVienDetailPage
    participant AppTable as ApplicantTableSection.tsx
    participant AppPopup as ApplicantDetailPopup.tsx
    participant ListAPI as api/doanhnghiep/ung-vien/route.ts GET()
    participant DetailAPI as api/doanhnghiep/ung-vien/[id]/route.ts GET()
    participant AppAPI as api/doanhnghiep/ung-vien/applications/[id]/route.ts PATCH()
    participant RespondAPI as api/respond/route.ts GET()
    participant DB as Prisma
    participant Mail as sendMail()

    Note over DN,Mail: ── Danh sách tin (trang /ung-vien) ──
    DN->>ListPage: Mở /doanhnghiep/ung-vien
    ListPage->>ListAPI: GET /api/doanhnghiep/ung-vien?q=&createdDate=&deadlineDate=&status=
    ListAPI->>DB: jobPost.findMany (với _count.jobApplications)
    DB-->>ListAPI: rows + applicantCount
    ListAPI-->>ListPage: { success, items[] }
    ListPage->>ListTable: Render bảng

    DN->>Toolbar: Nhập bộ lọc → "Tìm kiếm"
    Toolbar->>ListPage: onSearch(filters)
    ListPage->>ListAPI: GET với query params mới
    ListAPI-->>ListPage: items[] đã lọc

    Note over DN,Mail: ── Chi tiết tin + danh sách ứng viên ──
    DN->>ListTable: Click vào tin → /doanhnghiep/ung-vien/{jobId}
    DetailPage->>DetailAPI: GET /api/doanhnghiep/ung-vien/{jobId}
    DetailAPI->>DB: jobPost.findFirst + jobApplication.findMany
    DetailAPI->>DB: (lazy auto-decline) jobApplication.update<br/>nếu responseDeadline < now và status=PENDING
    DB-->>DetailAPI: { job, applicants[] }
    DetailAPI-->>DetailPage: data
    DetailPage->>AppTable: Render danh sách ứng viên

    Note over DN,Mail: ── Xem chi tiết + cập nhật trạng thái ứng viên ──
    DN->>AppTable: Nhấn "Xem chi tiết" trên 1 ứng viên
    AppTable->>DetailPage: openApplicant(applicant)
    DetailPage->>AppPopup: viewTarget = applicant → mở popup

    alt SV đã có nơi thực tập (internshipStatus ≠ NOT_STARTED)
        AppPopup->>DN: Text "Sinh viên đã có nơi thực tập"\n(chặn dropdown cập nhật)
    else SV chưa thực tập (NOT_STARTED)
        DN->>AppPopup: Chọn nextStatus từ dropdown<br/>getAvailableNextStatuses(currentStatus)
        alt nextStatus = INTERVIEW_INVITED
            AppPopup->>DN: Hiện thêm: thời gian PV, địa điểm PV, thời hạn phản hồi
        else nextStatus = OFFERED
            AppPopup->>DN: Hiện thêm: thời hạn phản hồi
        end
        DN->>AppPopup: Nhấn "Lưu"
        AppPopup->>DetailPage: submitUpdateStatus()
        DetailPage->>AppAPI: PATCH /api/doanhnghiep/ung-vien/applications/{applicationId}<br/>{ status, interviewAt?, interviewLocation?, responseDeadline? }
        AppAPI->>DB: jobApplication.findFirst (+ jobPost, enterpriseUser, studentUser.studentProfile)
        AppAPI->>DB: jobApplication.update (status, history JSON)

        alt nextStatus = INTERVIEW_INVITED
            AppAPI->>AppAPI: signRespondToken(CONFIRM_INTERVIEW, deadline) [jose.SignJWT]
            AppAPI->>AppAPI: signRespondToken(DECLINE_INTERVIEW, deadline)
            AppAPI->>Mail: sendMail → SV<br/>Email mời phỏng vấn:<br/>· Thời gian, địa điểm<br/>· Link xác nhận: /api/respond?token=confirmToken<br/>· Link từ chối: /api/respond?token=declineToken<br/>· Deadline: 2 link hết hiệu lực sau deadline
        else nextStatus = OFFERED
            AppAPI->>AppAPI: signRespondToken(CONFIRM_OFFER, deadline)
            AppAPI->>AppAPI: signRespondToken(DECLINE_OFFER, deadline)
            AppAPI->>Mail: sendMail → SV<br/>Email thông báo trúng tuyển:<br/>· Link xác nhận thực tập<br/>· Link từ chối thực tập<br/>· Deadline phản hồi
        else nextStatus = REJECTED
            AppAPI->>Mail: sendMail → SV<br/>Email thông báo từ chối (không có link)
        end
        Note over Mail: Lỗi email không block response
        AppAPI-->>DetailPage: { success, message }
        DetailPage->>DetailPage: load() – reload
        DetailPage->>DN: Toast thành công
    end

    Note over SV,Mail: ── SV phản hồi qua link trong email ──
    SV->>RespondAPI: GET /api/respond?token=...
    RespondAPI->>RespondAPI: verifyRespondToken(token) [lib/utils/respond-token.ts → jose.jwtVerify]
    alt Token hết hạn
        RespondAPI-->>SV: HTML page "Liên kết đã hết hiệu lực"
    else Token hợp lệ
        RespondAPI->>DB: jobApplication (kiểm tra đã phản hồi chưa)
        alt Đã phản hồi rồi
            RespondAPI-->>SV: HTML page "Đã phản hồi trước đó"
        else Chưa phản hồi
            RespondAPI->>DB: jobApplication.update(response)
            alt action = CONFIRM_OFFER
                RespondAPI->>DB: $transaction:<br/>studentProfile.update(internshipStatus=DOING)<br/>internshipStatusHistory.create
            end
            RespondAPI-->>SV: HTML page "Phản hồi thành công"
        end
    end
```

### API chi tiết

| Route | Method | Body | Prisma | Email |
|-------|--------|------|--------|-------|
| `/api/doanhnghiep/ung-vien` | GET | `?q, createdDate, deadlineDate, status` | `jobPost.findMany` (với `_count.jobApplications`) | Không |
| `/api/doanhnghiep/ung-vien/[id]` | GET | — | `jobPost.findFirst` + `jobApplication.findMany` + lazy auto-decline | Không |
| `/api/doanhnghiep/ung-vien/applications/[id]` | PATCH | `{ status, interviewAt?, interviewLocation?, responseDeadline? }` | `jobApplication.findFirst` + `jobApplication.update` | Có: SV |
| `/api/respond` | GET | `?token=` (JWT) | `jobApplication.update` + (CONFIRM_OFFER) `$transaction`: `studentProfile.update(DOING)` + `internshipStatusHistory.create` | Không |

### Email gửi đi khi cập nhật trạng thái ứng viên

| Sự kiện (nextStatus) | Người nhận | Nội dung email |
|--------------------|-----------|----------------|
| `INTERVIEW_INVITED` | SV | Mời phỏng vấn: thời gian, địa điểm, link Xác nhận + Từ chối (JWT token, hết hạn theo `responseDeadline`) |
| `OFFERED` | SV | Thông báo trúng tuyển: link Xác nhận thực tập + Từ chối (JWT token, hết hạn theo `responseDeadline`) |
| `REJECTED` | SV | Thông báo từ chối ứng tuyển (không có link) |

> **Token email:** sử dụng `signRespondToken()` từ `lib/utils/respond-token.ts` (ký `jose.SignJWT`). SV click link → `/api/respond?token=...` → `verifyRespondToken()` → cập nhật DB → trả về trang HTML kết quả.

---

## 4. Đổi mật khẩu (`/auth/doimatkhau`)

### Chức năng
- Đổi mật khẩu khi đã đăng nhập
- Yêu cầu nhập mật khẩu hiện tại để xác thực

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    participant Page as auth/doimatkhau/page.tsx<br/>ChangePasswordPage
    participant Card as ChangePasswordFormCard.tsx
    participant MeAPI as api/auth/me/route.ts GET()
    participant ChangePwdAPI as api/auth/change-password/route.ts POST()
    participant Lib as lib/auth/
    participant DB as Prisma

    Note over DN,DB: ── Tải trang ──
    DN->>Page: Mở /auth/doimatkhau (từ sidebar)
    Page->>MeAPI: GET /api/auth/me
    MeAPI->>MeAPI: verifySession(cookies) [lib/auth/jwt.ts]
    MeAPI-->>Page: { authenticated, role:"doanhnghiep", home:"/doanhnghiep/dashboard" }
    Page->>Card: Render form + link "Quay lại bảng điều khiển"

    Note over DN,DB: ── Đổi mật khẩu ──
    DN->>Card: Nhập MK hiện tại + MK mới + xác nhận MK mới
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
            Page->>DN: Thông báo đổi mật khẩu thành công
        else Sai mật khẩu
            ChangePwdAPI-->>Page: 400
            Page->>DN: mapChangePasswordApiError() – hiển thị lỗi field
        end
    else Validation thất bại
        Page->>DN: Hiển thị fieldErrors
    end
```

### API chi tiết

| Route | Method | Prisma | Email |
|-------|--------|--------|-------|
| `/api/auth/me` | GET | Không (chỉ verify JWT cookie) | Không |
| `/api/auth/change-password` | POST | `user.findUnique` + `user.update(passwordHash)` | Không |

---

## 5. Dashboard (`/doanhnghiep/dashboard`)

### Chức năng
- Tổng quan: số tin đang hoạt động, số ứng viên mới (7 ngày), số SV đang thực tập
- Danh sách task gợi ý hành động tiếp theo

### Sơ đồ luồng

```mermaid
sequenceDiagram
    actor DN as Doanh nghiệp
    participant Page as doanhnghiep/dashboard/page.tsx<br/>EnterpriseDashboardPage
    participant Stats as EnterpriseDashboardStats.tsx
    participant Tasks as EnterpriseDashboardTasks.tsx
    participant API as api/doanhnghiep/dashboard/overview/route.ts GET()
    participant DB as Prisma

    DN->>Page: Mở /doanhnghiep/dashboard
    Page->>API: fetchEnterpriseDashboardOverview()<br/>lib/utils/doanhnghiep-dashboard.ts<br/>→ GET /api/doanhnghiep/dashboard/overview
    API->>DB: jobPost.count(ACTIVE, của enterprise)<br/>jobApplication.count(mới 7 ngày, response=ACCEPTED)<br/>jobApplication.count(SV đang thực tập của DN)
    DB-->>API: counts
    API->>API: Build: openPosts, newApplications, receivingStudents, tasks[]
    API-->>Page: { success, item: EnterpriseDashboardItem }
    Page->>Stats: openPosts, newApplications, receivingStudents
    Page->>Tasks: tasks[]
    Page->>DN: Render dashboard
```

### API chi tiết

| Route | Method | Prisma | Trả về |
|-------|--------|--------|--------|
| `/api/doanhnghiep/dashboard/overview` | GET | `jobPost.count` + `jobApplication.count` ×2 | `{ openPosts, newApplications, receivingStudents, tasks[] }` |

---

## Tổng hợp luồng trạng thái ứng viên

```mermaid
stateDiagram-v2
    [*] --> PENDING : SV nộp hồ sơ\n(POST /api/sinhvien/tra-cuu-ung-tuyen/[id]/apply)

    PENDING --> INTERVIEW_INVITED : DN mời phỏng vấn\n→ Email SV (link xác nhận/từ chối + JWT deadline)
    PENDING --> OFFERED : DN chọn Trúng tuyển trực tiếp\n→ Email SV (link xác nhận/từ chối + JWT deadline)
    PENDING --> REJECTED : DN từ chối\n→ Email SV (thông báo)
    PENDING --> STUDENT_DECLINED : Lazy auto-decline\n(responseDeadline hết hạn)

    INTERVIEW_INVITED --> STUDENT_CONFIRMED_INTERVIEW : SV xác nhận phỏng vấn\n(/api/respond?token=confirm)
    INTERVIEW_INVITED --> STUDENT_DECLINED_INTERVIEW : SV từ chối phỏng vấn\n(/api/respond?token=decline)
    INTERVIEW_INVITED --> STUDENT_DECLINED : Quá thời hạn phản hồi\n(lazy auto-decline)

    STUDENT_CONFIRMED_INTERVIEW --> OFFERED : DN chọn Trúng tuyển\n→ Email SV
    STUDENT_CONFIRMED_INTERVIEW --> REJECTED : DN từ chối\n→ Email SV

    OFFERED --> STUDENT_CONFIRMED_OFFER : SV xác nhận thực tập\n(/api/respond?token=confirm)\n→ studentProfile.internshipStatus = DOING
    OFFERED --> STUDENT_DECLINED_OFFER : SV từ chối thực tập\n(/api/respond?token=decline)
    OFFERED --> STUDENT_DECLINED : Quá thời hạn phản hồi\n(lazy auto-decline)

    STUDENT_DECLINED_INTERVIEW --> [*] : Khoá – không cập nhật tiếp
    STUDENT_DECLINED_OFFER --> [*] : Khoá
    STUDENT_CONFIRMED_OFFER --> [*] : Khoá – SV đang thực tập
    REJECTED --> [*] : Khoá
```

---

## Tổng hợp API toàn module

| API Route | Method | Auth | Email | Ghi chú |
|-----------|--------|------|-------|---------|
| `/api/doanhnghiep/me` | GET | doanhnghiep | — | Thông tin tài khoản DN |
| `/api/doanhnghiep/me` | PATCH | doanhnghiep | — | Cập nhật thông tin DN |
| `/api/doanhnghiep/dashboard/overview` | GET | doanhnghiep | — | Tổng quan dashboard |
| `/api/doanhnghiep/tuyen-dung` | GET | doanhnghiep | — | Danh sách tin + auto-stop hết hạn |
| `/api/doanhnghiep/tuyen-dung` | POST | doanhnghiep | — | Tạo tin tuyển dụng mới |
| `/api/doanhnghiep/tuyen-dung/open-batch` | GET | doanhnghiep | — | Kiểm tra đợt thực tập đang mở |
| `/api/doanhnghiep/tuyen-dung/[id]` | GET | doanhnghiep | — | Chi tiết tin tuyển dụng |
| `/api/doanhnghiep/tuyen-dung/[id]` | PATCH | doanhnghiep | — | Chỉnh sửa tin |
| `/api/doanhnghiep/tuyen-dung/[id]` | DELETE | doanhnghiep | — | Xoá tin (nếu chưa có ứng viên) |
| `/api/doanhnghiep/tuyen-dung/[id]/status` | PATCH | doanhnghiep | — | Dừng hoạt động tin |
| `/api/doanhnghiep/ung-vien` | GET | doanhnghiep | — | Danh sách job + số ứng viên |
| `/api/doanhnghiep/ung-vien/[id]` | GET | doanhnghiep | — | Chi tiết job + ứng viên + lazy auto-decline |
| `/api/doanhnghiep/ung-vien/applications/[id]` | PATCH | doanhnghiep | Có | Cập nhật trạng thái ứng viên + email SV |
| `/api/respond` | GET | Token JWT | — | SV phản hồi qua link email |
| `/api/auth/me` | GET | cookie | — | Lấy role + home URL |
| `/api/auth/change-password` | POST | cookie | — | Đổi mật khẩu |
