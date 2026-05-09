"use client";

import type { AssignmentItem } from "@/lib/types/admin-phan-cong-gvhd";
import MessagePopup from "../../../components/MessagePopup";
import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

import styles from "../../styles/dashboard.module.css";

type Props = {
  deleteTarget: AssignmentItem | null;
  busyId: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminPhanCongGVHDDeletePopup(props: Props) {
  const { deleteTarget, busyId, onClose, onConfirm } = props;

  if (!deleteTarget) return null;

  return (
    <MessagePopup
      open
      title="Xóa phân công"
      size="wide"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className={styles.btn}
            onClick={onClose}
            disabled={busyId === deleteTarget?.id}
          >
            Hủy
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={onConfirm}
            disabled={busyId === deleteTarget?.id}
          >
            Xác nhận
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        <table className={styles.viewModalDetailTable}>
          <tbody>
            <tr>
              <th scope="row">SV hướng dẫn</th>
              <td>
                {Array.isArray(deleteTarget.students) && deleteTarget.students.length ? (
                  <div style={{ display: "grid", gap: 4 }}>
                    {deleteTarget.students.map((s) => (
                      <span key={String(s.id || `${s.msv}-${s.fullName}`)}>{studentDisplay(s as any)}</span>
                    ))}
                  </div>
                ) : deleteTarget.student?.msv ? (
                  studentDisplay(deleteTarget.student as any)
                ) : (
                  "—"
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">Giảng viên hướng dẫn</th>
              <td>{supervisorDisplay(deleteTarget.supervisor as any) || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Khoa</th>
              <td>{deleteTarget.faculty || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </MessagePopup>
  );
}

