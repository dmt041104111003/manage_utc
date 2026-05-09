"use client";

import type { SupervisorListItem } from "@/lib/types/admin-quan-ly-gvhd";
import { ADMIN_QUAN_LY_GVHD_DEGREE_LABEL } from "@/lib/constants/admin-quan-ly-gvhd";

import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  target: SupervisorListItem | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminGiangVienDeletePopup(props: Props) {
  const { target, busy, onClose, onConfirm } = props;
  if (!target) return null;

  return (
    <MessagePopup
      open
      title="Xóa giảng viên hướng dẫn"
      size="wide"
      onClose={onClose}
      actions={
        <>
          <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy} onClick={onConfirm}>
            Xóa
          </button>
        </>
      }
    >
      <p>
        Bạn có chắc chắn muốn xóa giảng viên hướng dẫn <strong>[{ADMIN_QUAN_LY_GVHD_DEGREE_LABEL[target.degree]}]</strong>-
        <strong>[{target.fullName}]</strong>-<strong>[{target.faculty}]</strong> không?
      </p>
    </MessagePopup>
  );
}

