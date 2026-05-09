"use client";

import type { AssignmentItem } from "@/lib/types/admin-phan-cong-gvhd";
import {
  ADMIN_PHAN_CONG_GVHD_PAGE_SIZE,
  ADMIN_PHAN_CONG_GVHD_STATUS_LABEL
} from "@/lib/constants/admin-phan-cong-gvhd";

import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

import TableIconButton from "../../../components/TableIconButton";
import { FiEye, FiTrash2 } from "react-icons/fi";
import styles from "../../styles/dashboard.module.css";

export type Props = {
  paged: AssignmentItem[];
  page: number;
  busyId: string | null;
  onView: (item: AssignmentItem) => void;
  onDelete: (item: AssignmentItem) => void;
};

export default function AdminPhanCongGVHDTable(props: Props) {
  const { paged, page, busyId, onView, onDelete } = props;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>STT</th>
            <th>MSV-Họ tên-Bậc</th>
            <th>Bậc-Họ tên giảng viên hướng dẫn</th>
            <th>Khoa</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.modulePlaceholder}>
                Không có dữ liệu.
              </td>
            </tr>
          ) : (
            paged.map((it, idx) => (
              <tr key={it.id}>
                <td data-label="STT">
                  {(page - 1) * ADMIN_PHAN_CONG_GVHD_PAGE_SIZE + idx + 1}
                </td>
                <td data-label="MSV-Họ tên-Bậc">
                  {it.student?.msv ? studentDisplay(it.student as any) : "—"}
                </td>
                <td data-label="Bậc-Họ tên GVHD">{supervisorDisplay(it.supervisor as any)}</td>
                <td data-label="Khoa">{it.faculty}</td>
                <td data-label="Trạng thái">{ADMIN_PHAN_CONG_GVHD_STATUS_LABEL[it.status]}</td>
                <td data-label="Thao tác">
                  <div className={styles.rowActions} style={{ gap: 6 }}>
                    <TableIconButton label="Xem phân công" onClick={() => onView(it)} disabled={busyId !== null}>
                      <FiEye size={18} />
                    </TableIconButton>
                    <TableIconButton label="Xóa phân công" variant="danger" onClick={() => onDelete(it)} disabled={busyId === it.id}>
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
