"use client";

import type { InternshipStatus, StudentListItem } from "@/lib/types/admin-quan-ly-sinh-vien";
import {
  ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_LABEL,
  ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_OPTIONS
} from "@/lib/constants/admin-quan-ly-sinh-vien";
import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  target: StudentListItem | null;
  statusDraft: InternshipStatus;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onChangeStatus: (v: InternshipStatus) => void;
};

export default function AdminSinhVienStatusPopup(props: Props) {
  const { target, statusDraft, busy, onClose, onConfirm, onChangeStatus } = props;
  if (!target) return null;

  return (
    <MessagePopup
      open
      title="Theo dõi trạng thái thực tập"
      size="wide"
      onClose={onClose}
      actions={
        <>
          <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={onConfirm}>
            Lưu
          </button>
        </>
      }
    >
      <p style={{ marginTop: 0 }}>
        SV: <strong>{target.msv}</strong> - {target.fullName}
      </p>
      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Trạng thái</label>
        <select
          style={{ width: "100%", marginTop: 6 }}
          value={statusDraft}
          onChange={(e) => onChangeStatus(e.target.value as InternshipStatus)}
          disabled={busy}
        >
          {ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ADMIN_QUAN_LY_SINH_VIEN_INTERNSHIP_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </MessagePopup>
  );
}
