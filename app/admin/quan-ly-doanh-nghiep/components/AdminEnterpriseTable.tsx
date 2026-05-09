"use client";

import type { AdminEnterpriseListItem } from "@/lib/types/admin";
import { ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE } from "@/lib/constants/admin-quan-ly-doanh-nghiep";
import { EnterpriseStatusCell } from "../../components/EnterpriseStatusCell";
import TableIconButton from "../../../components/TableIconButton";
import { FiEye, FiRefreshCw, FiTrash2 } from "react-icons/fi";

import styles from "../../styles/dashboard.module.css";

type Props = {
  items: AdminEnterpriseListItem[];
  page: number;
  busyId: string | null;
  onView: (row: AdminEnterpriseListItem) => void;
  onDelete: (row: AdminEnterpriseListItem) => void;
  onOpenStatus: (row: AdminEnterpriseListItem) => void;
};

export default function AdminEnterpriseTable(props: Props) {
  const { items, page, busyId, onView, onDelete, onOpenStatus } = props;

  const pagedItems = items.slice(
    (page - 1) * ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE,
    (page - 1) * ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE + ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên doanh nghiệp</th>
            <th>Mã số thuế</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.modulePlaceholder}>
                Không có doanh nghiệp phù hợp.
              </td>
            </tr>
          ) : (
            pagedItems.map((row, idx) => (
              <tr key={row.id}>
                <td data-label="STT">{(page - 1) * ADMIN_QUAN_LY_DOANH_NGHIEP_PAGE_SIZE + idx + 1}</td>
                <td data-label="Tên doanh nghiệp">{row.companyName || "—"}</td>
                <td data-label="MST">{row.taxCode || "—"}</td>
                <td data-label="Trạng thái">
                  <EnterpriseStatusCell status={row.enterpriseStatus} isLocked={row.isLocked} />
                </td>
                <td data-label="Thao tác">
                  <div className={styles.rowActions} style={{ gap: 6 }}>
                    <TableIconButton label="Xem chi tiết" disabled={busyId !== null} onClick={() => onView(row)}>
                      <FiEye size={18} />
                    </TableIconButton>
                    <TableIconButton label="Cập nhật trạng thái phê duyệt" disabled={busyId !== null} onClick={() => onOpenStatus(row)}>
                      <FiRefreshCw size={18} />
                    </TableIconButton>
                    <TableIconButton label="Xóa doanh nghiệp" variant="danger" disabled={busyId !== null} onClick={() => onDelete(row)}>
                      <FiTrash2 size={18} />
                    </TableIconButton>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

