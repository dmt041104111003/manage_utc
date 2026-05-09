"use client";

import type { JobListItem } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import {
  ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE,
  statusLabel
} from "@/lib/constants/admin-quan-ly-tin-tuyen-dung";
import { formatDateVi } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";
import Pagination from "../../../components/Pagination";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: JobListItem[];
  page: number;
  busyId: string | null;
  onPageChange: (p: number) => void;
  onView: (row: JobListItem) => void;
  onStatus: (row: JobListItem) => void;
  onDelete: (row: JobListItem) => void;
};

export default function AdminTinTuyenDungTableSection(props: Props) {
  const { loading, items, page, busyId, onPageChange, onView, onStatus, onDelete } = props;

  if (loading) return <p className={styles.modulePlaceholder}>Đang tải…</p>;

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE + ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE
  );

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tiêu đề</th>
              <th>Tên doanh nghiệp</th>
              <th>Ngày đăng tin</th>
              <th>Đợt thực tập</th>
              <th>Trạng thái tin</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.modulePlaceholder}>
                  Không có tin tuyển dụng phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE + idx + 1}</td>
                  <td data-label="Tiêu đề">{row.title}</td>
                  <td data-label="Tên doanh nghiệp">{row.enterpriseName || "—"}</td>
                  <td data-label="Ngày đăng tin">{formatDateVi(row.createdAt)}</td>
                  <td data-label="Đợt thực tập">{row.batchName || "—"}</td>
                  <td data-label="Trạng thái tin">{statusLabel[row.status]}</td>
                  <td data-label="Thao tác">
                    <div className={styles.rowActions} style={{ gap: 10 }}>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => onView(row)}>
                        Xem
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => onStatus(row)}>
                        Duyệt tin
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
        pageSize={ADMIN_QUAN_LY_TIN_TUYEN_DUNG_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={styles.btn}
        activeButtonClassName={`${styles.btn} ${styles.btnPrimary}`}
      />
    </>
  );
}
