# Excel trong dự án (xuất / mẫu / import)

Tài liệu mô tả **cách tích hợp thư viện Excel**, **luồng dữ liệu**, và **chỗ dùng trong UI** để dev nối thêm tính năng tương tự.

## Thư viện

- **Package:** [`xlsx`](https://www.sheetjs.com/) (`^0.18.5` trong `package.json`).
- **Khai báo module:** `types/xlsx.d.ts` (`declare module "xlsx"`).

## Hai kiểu tích hợp

### 1. Xuất file trên server (API Route)

**Khi nào:** Cần gom dữ liệu từ DB + kiểm tra quyền (session), file lớn hoặc logic phức tạp.

**Luồng:**

1. `GET` (hoặc `POST`) trong `app/api/.../route.ts`.
2. Xác thực (`getAdminSession`, cookie GV, …).
3. Query Prisma theo **cùng tham số filter** với màn danh sách (hoặc subset).
4. `import * as XLSX from "xlsx"` → `XLSX.utils.aoa_to_sheet([header, ...rows])` → `XLSX.utils.book_new()` → `XLSX.write(wb, { type: "buffer", bookType: "xlsx" })`.
5. Trả `NextResponse` với:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="ascii.xlsx"; filename*=UTF-8''<encodeURIComponent tên UTF-8>`  
     (tên tiếng Việt dùng `filename*`).

**Client:** `fetch(url)` → `res.blob()` → `<a download>` + `URL.createObjectURL` (giống các trang admin/GV đã làm).

### 2. Trình duyệt: mẫu Excel + đọc import

**Khi nào:** Tạo file mẫu không cần DB; hoặc parse file upload rồi gửi JSON lên API import.

**Luồng:**

1. `const XLSXMod = await import("xlsx")` (dynamic import, giảm bundle trang).
2. Build sheet từ header + dòng mẫu (constants trong `lib/constants/*-excel.ts`).
3. `XLSX.write(wb, { type: "array", bookType: "xlsx" })` → `Blob` → download.

**Import:** Đọc `arrayBuffer` → `XLSX.read` → `sheet_to_json(..., { header: 1 })` → map cột theo tên header → `POST` `/api/admin/.../import`.

## Bảng tính năng hiện có

| Khu vực | UI | API / hành động | Query / điều kiện | Ghi chú |
|--------|-----|------------------|-------------------|---------|
| Admin – Đợt TT | Cột thao tác (icon tải) | `GET /api/admin/internship-batches/[id]/export-students` | Theo **một đợt** `[id]` | Cột khớp `ADMIN_STUDENT_EXCEL_HEADER`; SV dedupe theo `studentProfileId`. |
| Admin – Sinh viên | Toolbar **Xuất Excel theo bộ lọc** | `GET /api/admin/students/export` | `q`, `faculty`, `status`, `degree` (giống list) | Thêm cột GVHD + đợt; max **8000** dòng. Không filter → gần như **toàn bộ SV** (đến giới hạn). |
| Admin – Tiến độ TT | Toolbar **Xuất Excel theo bộ lọc** | `GET /api/admin/tien-do-thuc-tap/export` | `q`, `faculty`, `degree`, `status` (giống list, có `APPROVED_REPORT`) | Có điểm BCTT (GVHD/DN), DN, GVHD; max **8000**. |
| GV – Quản lý BCTT | Toolbar **Xuất Excel theo bộ lọc** | `GET /api/giangvien/bao-cao-thuc-tap/export` | `q`, `degree`, `status` | Chỉ SV **được phân công cho GV**; logic đợt OPEN / fallback giống list; max **8000**. |
| Admin – Sinh viên | Mẫu + **Thêm danh sách (Excel)** | Client tạo mẫu; `POST /api/admin/students/import` | — | Header: `lib/constants/admin-students-excel.ts`. |
| Admin – GVHD | Mẫu + import | Client; `POST` import GVHD (xem `quan-ly-gvhd`) | — | `lib/constants/admin-supervisors-excel.ts`. |

## Hằng số cột (single source)

- Sinh viên (import / export đợt): `lib/constants/admin-students-excel.ts` (`ADMIN_STUDENT_EXCEL_HEADER`, export filter thêm `ADMIN_STUDENT_FILTER_EXPORT_*`).
- Tiến độ admin: `lib/constants/admin-quan-ly-tien-do-thuc-tap.ts` (`ADMIN_TIEN_DO_FILTER_EXPORT_HEADER`).
- BCTT GV: `lib/constants/giangvien-bao-cao-thuc-tap.ts` (`GIANGVIEN_BAO_CAO_EXPORT_HEADER`).
- GVHD: `lib/constants/admin-supervisors-excel.ts`.

Khi thêm cột: **sửa constant + route export + (nếu có) import mapping** cho khớp.

## Chi tiết kỹ thuật thường gặp

- **Ô kiểu chữ:** Sau `aoa_to_sheet`, có thể set `cell.t = "s"` cho dòng dữ liệu để tránh Excel auto-format số/ngày sai (xem các route export).
- **Độ rộng cột:** `ws["!cols"] = [{ wch: N }, ...]`.
- **Tên sheet:** Excel giới hạn **31** ký tự, không ký tự đặc biệt một số loại.
- **Giới hạn số dòng:** Export admin/GV trả **400** nếu vượt ngưỡng (tránh OOM); nên giữ filter hoặc tăng chỉ khi đo được.

## Thêm export “theo filter” mới (checklist)

1. Tách hoặc tái sử dụng **cùng điều kiện `where`** / query với API list (`build*Where` trong `lib/server/` nếu cần).
2. Thêm `GET app/api/.../export/route.ts` + session đúng role.
3. Khai báo **header** trong `lib/constants/...`.
4. UI: `fetch` blob + parse `Content-Disposition` + download; nút `disabled` khi `busy`.
5. Ghi rõ trong UI/tooltip: **không filter** thì phạm vi là “tất cả bản ghi trong phạm vi quyền” hay “chỉ assignment”.

## Tài liệu role khác

Chi tiết luồng nghiệp vụ từng module: `docs/admin.md`, `docs/giangvien.md`, … (tìm các endpoint trong bảng trên).
