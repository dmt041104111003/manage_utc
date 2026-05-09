"use client";

import type { AssignmentItem } from "@/lib/types/admin-phan-cong-gvhd";
import {
  ADMIN_PHAN_CONG_GVHD_PAGE_SIZE,
  ADMIN_PHAN_CONG_GVHD_TABLE_STUDENTS_MAX_LINES,
  ADMIN_PHAN_CONG_GVHD_STATUS_LABEL
} from "@/lib/constants/admin-phan-cong-gvhd";

import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

import styles from "../../styles/dashboard.module.css";

type Props = {
  paged: AssignmentItem[];
  page: number;
  busyId: string | null;
  onView: (item: AssignmentItem) => void;
  onEdit: (item: AssignmentItem) => void;
  onDelete: (item: AssignmentItem) => void;
};

export default function AdminPhanCongGVHDTable(props: Props) {
  const { paged, page, busyId, onView, onEdit, onDelete } = props;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>STT</th>
            <th>MSV-Họ tên-Bậc</th>
            <th>Bậc-Họ tên GVHD</th>
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
                  {it.students.length ? (
                    <div style={{ display: "grid", gap: 4 }}>
                      {it.students.slice(0, ADMIN_PHAN_CONG_GVHD_TABLE_STUDENTS_MAX_LINES).map((s) => (
                        <div key={s.id ?? `${s.msv}-${s.fullName}`}>{studentDisplay(s as any)}</div>
                      ))}
                      {it.students.length > ADMIN_PHAN_CONG_GVHD_TABLE_STUDENTS_MAX_LINES ? (
                        <div style={{ color: "#6b7280" }}>
                          +{it.students.length - ADMIN_PHAN_CONG_GVHD_TABLE_STUDENTS_MAX_LINES} SV
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td data-label="Bậc-Họ tên GVHD">{supervisorDisplay(it.supervisor as any)}</td>
                <td data-label="Khoa">{it.faculty}</td>
                <td data-label="Trạng thái">{ADMIN_PHAN_CONG_GVHD_STATUS_LABEL[it.status]}</td>
                <td data-label="Thao tác">
                  <div className={styles.rowActions} style={{ gap: 10 }}>
                    <button
                      type="button"
                      className={styles.textLinkBtn}
                      onClick={() => onView(it)}
                      disabled={busyId !== null}
                    >
                      Xem phân công
                    </button>
                    <button
                      type="button"
                      className={styles.textLinkBtn}
                      onClick={() => onEdit(it)}
                      disabled={busyId !== null}
                    >
                      Sửa phân công
                    </button>
                    <button
                      type="button"
                      className={styles.textLinkBtn}
                      onClick={() => onDelete(it)}
                      disabled={busyId === it.id}
                    >
                      Xóa phân công
                    </button>
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

