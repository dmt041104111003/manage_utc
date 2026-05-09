"use client";

import type { InternshipBatchRow } from "@/lib/types/admin-quan-ly-dot-thuc-tap";
import {
  ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE,
  ADMIN_QUAN_LY_DOT_THUC_TAP_SEMESTER_OPTIONS,
  ADMIN_QUAN_LY_DOT_THUC_TAP_STATUS_LABEL
} from "@/lib/constants/admin-quan-ly-dot-thuc-tap";
import { formatDateVi } from "@/lib/utils/admin-quan-ly-dot-thuc-tap-dates";

import Pagination from "../../../components/Pagination";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: InternshipBatchRow[];
  page: number;
  busyId: string | null;
  canClose: (row: InternshipBatchRow) => boolean;
  onPageChange: (p: number) => void;
  onView: (row: InternshipBatchRow) => void;
  onEdit: (row: InternshipBatchRow) => void;
  onDelete: (row: InternshipBatchRow) => void;
  onOpenStatus: (row: InternshipBatchRow) => void;
};

export default function AdminInternshipBatchTableSection(props: Props) {
  const { loading, items, page, busyId, canClose, onPageChange, onView, onEdit, onDelete, onOpenStatus } = props;

  if (loading) {
    return <p className={styles.modulePlaceholder}>Đang tải…</p>;
  }

  const pagedItems = items.slice((page - 1) * ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE, (page - 1) * ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE + ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE);

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên đợt thực tập</th>
              <th>Học kỳ</th>
              <th>Năm học</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.modulePlaceholder}>
                  Không có đợt thực tập phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE + idx + 1}</td>
                  <td data-label="Tên đợt thực tập">{row.name}</td>
                  <td data-label="Học kỳ">
                    {ADMIN_QUAN_LY_DOT_THUC_TAP_SEMESTER_OPTIONS.find((s) => s.value === row.semester)?.label ?? row.semester}
                  </td>
                  <td data-label="Năm học">{row.schoolYear}</td>
                  <td data-label="Thời gian">
                    {formatDateVi(row.startDate)} - {formatDateVi(row.endDate)}
                  </td>
                  <td data-label="Trạng thái">{ADMIN_QUAN_LY_DOT_THUC_TAP_STATUS_LABEL[row.status]}</td>
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
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        disabled={busyId !== null || !canClose(row)}
                        onClick={() => onOpenStatus(row)}
                      >
                        Cập nhật trạng thái
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
        pageSize={ADMIN_QUAN_LY_DOT_THUC_TAP_PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={styles.btn}
      />
    </>
  );
}

