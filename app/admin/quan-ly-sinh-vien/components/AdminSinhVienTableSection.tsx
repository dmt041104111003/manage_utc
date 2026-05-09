"use client";

import type { StudentListItem } from "@/lib/types/admin-quan-ly-sinh-vien";
import {
  ADMIN_QUAN_LY_SINH_VIEN_DEGREE_LABEL,
  ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_LABEL,
  ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE
} from "@/lib/constants/admin-quan-ly-sinh-vien";
import Pagination from "../../../components/Pagination";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: StudentListItem[];
  page: number;
  busyId: string | null;
  onPageChange: (p: number) => void;
  onView: (row: StudentListItem) => void;
  onEdit: (row: StudentListItem) => void;
  onDelete: (row: StudentListItem) => void;
};

export default function AdminSinhVienTableSection(props: Props) {
  const { loading, items, page, busyId, onPageChange, onView, onEdit, onDelete } = props;

  if (loading) return <p className={styles.modulePlaceholder}>Đang tải…</p>;

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE + ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE
  );

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>MSV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Khoa</th>
              <th>Bậc</th>
              <th>Trạng thái GVHD</th>
              <th>Trạng thái thực tập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.modulePlaceholder}>
                  Không có sinh viên phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE + idx + 1}</td>
                  <td data-label="MSV">{row.msv}</td>
                  <td data-label="Họ tên">{row.fullName}</td>
                  <td data-label="Lớp">{row.className}</td>
                  <td data-label="Khoa">{row.faculty}</td>
                  <td data-label="Bậc">{ADMIN_QUAN_LY_SINH_VIEN_DEGREE_LABEL[row.degree]}</td>
                  <td data-label="Trạng thái GVHD">{row.hasSupervisor ? "Đã có GVHD" : "Chưa có GVHD"}</td>
                  <td data-label="Trạng thái thực tập">
                    {ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_LABEL[row.internshipStatus]}
                  </td>
                  <td data-label="Thao tác">
                    <div className={styles.rowActions} style={{ gap: 10 }}>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => onView(row)}>
                        Xem
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => onEdit(row)}>
                        Sửa
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => onDelete(row)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={ADMIN_QUAN_LY_SINH_VIEN_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={styles.btn}
        activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
      />
    </>
  );
}
