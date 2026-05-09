"use client";

import type { InternshipBatchRow } from "@/lib/types/admin-quan-ly-dot-thuc-tap";
import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  deleteTarget: InternshipBatchRow | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminInternshipBatchDeletePopup(props: Props) {
  const { deleteTarget, busy, onClose, onConfirm } = props;
  if (!deleteTarget) return null;

  return (
    <MessagePopup
      open
      title="Xóa đợt thực tập"
      size="wide"
      onClose={onClose}
      actions={
        <>
          <button type="button" className={styles.btn} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy} onClick={onConfirm}>
            Xóa
          </button>
        </>
      }
    >
      <p>
        Bạn có chắc chắn muốn xóa Đợt thực tập <strong>{deleteTarget.name}</strong> không?
      </p>
    </MessagePopup>
  );
}

