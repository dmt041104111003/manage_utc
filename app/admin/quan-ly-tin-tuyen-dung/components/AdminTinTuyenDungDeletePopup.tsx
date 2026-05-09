"use client";

import type { JobListItem } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import styles from "../../styles/dashboard.module.css";

type Props = {
  target: JobListItem | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminTinTuyenDungDeletePopup(props: Props) {
  const { target, busy, onClose, onConfirm } = props;
  if (!target) return null;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-del-title">
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <h2 id="job-del-title">Xóa tin</h2>
        <p>
          Bạn có chắc chắn muốn xóa tin tuyển dụng:{" "}
          <strong>{target.title}</strong> - {target.enterpriseName || "—"} - {target.enterpriseTaxCode || "—"} không?
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm} disabled={busy}>
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
