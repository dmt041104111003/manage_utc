"use client";

import type { ListRow } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";
import {
  ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE,
  degreeLabel
} from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";
import Pagination from "../../../components/Pagination";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: ListRow[];
  page: number;
  busyId: string | null;
  onPageChange: (p: number) => void;
  onView: (row: ListRow) => void;
  onEdit: (row: ListRow) => void;
};

export default function AdminTienDoTableSection(props: Props) {
  const { loading, items, page, busyId, onPageChange, onView, onEdit } = props;

  if (loading) return <p className={styles.modulePlaceholder}>Đang tải…</p>;

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE + ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE
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
              <th>Trạng thái thực tập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.modulePlaceholder}>
                  Không có sinh viên phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE + idx + 1}</td>
                  <td data-label="MSV">{row.msv}</td>
                  <td data-label="Họ tên">{row.fullName}</td>
                  <td data-label="Lớp">{row.className}</td>
                  <td data-label="Khoa">{row.faculty}</td>
                  <td data-label="Bậc">{degreeLabel[row.degree]}</td>
                  <td data-label="Trạng thái thực tập">{row.statusLabel}</td>
                  <td data-label="Thao tác">
                    <div className={styles.rowActions} style={{ gap: 10 }}>
                      <button type="button" className={styles.textLinkBtn} onClick={() => onView(row)} disabled={busyId !== null}>
                        Xem
                      </button>
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        onClick={() => onEdit(row)}
                        disabled={busyId !== null || !row.canFinalUpdate}
                      >
                        Cập nhật trạng thái cuối cùng
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
        pageSize={ADMIN_QUAN_LY_TIEN_DO_THUC_TAP_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={styles.btn}
        activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
      />
    </>
  );
}
