"use client";

import type { SupervisorListItem } from "@/lib/types/admin-quan-ly-gvhd";
import {
  ADMIN_QUAN_LY_GVHD_DEGREE_LABEL,
  ADMIN_QUAN_LY_GVHD_PAGE_SIZE
} from "@/lib/constants/admin-quan-ly-gvhd";

import Pagination from "../../../components/Pagination";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: SupervisorListItem[];
  page: number;
  busyId: string | null;
  onPageChange: (p: number) => void;
  onView: (row: SupervisorListItem) => void;
  onEdit: (row: SupervisorListItem) => void;
  onDelete: (row: SupervisorListItem) => void;
};

export default function AdminGiangVienTableSection(props: Props) {
  const { loading, items, page, busyId, onPageChange, onView, onEdit, onDelete } = props;

  if (loading) return <p className={styles.modulePlaceholder}>Đang tải…</p>;

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_GVHD_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_GVHD_PAGE_SIZE + ADMIN_QUAN_LY_GVHD_PAGE_SIZE
  );

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Khoa</th>
              <th>Bậc</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.modulePlaceholder}>
                  Không có GVHD phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_GVHD_PAGE_SIZE + idx + 1}</td>
                  <td data-label="Họ tên">{row.fullName}</td>
                  <td data-label="Số điện thoại">{row.phone ?? "—"}</td>
                  <td data-label="Email">{row.email}</td>
                  <td data-label="Khoa">{row.faculty}</td>
                  <td data-label="Bậc">{ADMIN_QUAN_LY_GVHD_DEGREE_LABEL[row.degree]}</td>
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
        pageSize={ADMIN_QUAN_LY_GVHD_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={styles.btn}
        activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
      />
    </>
  );
}

