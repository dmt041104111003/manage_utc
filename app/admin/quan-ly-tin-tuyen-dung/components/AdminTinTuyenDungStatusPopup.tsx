"use client";

import type { JobListItem, StatusAction } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import { statusLabel } from "@/lib/constants/admin-quan-ly-tin-tuyen-dung";
import styles from "../../styles/dashboard.module.css";

type Props = {
  target: JobListItem | null;
  statusAction: StatusAction;
  rejectReason: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeStatusAction: (v: StatusAction) => void;
  onChangeRejectReason: (v: string) => void;
};

export default function AdminTinTuyenDungStatusPopup(props: Props) {
  const {
    target,
    statusAction,
    rejectReason,
    busy,
    onClose,
    onSubmit,
    onChangeStatusAction,
    onChangeRejectReason
  } = props;

  if (!target) return null;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-status-title">
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <h2 id="job-status-title">Cập nhật trạng thái</h2>
        <p style={{ marginTop: 0 }}>
          Tin: <strong>{target.title}</strong> - {target.enterpriseName || "—"}
        </p>
        <p style={{ marginTop: 0 }}>
          Trạng thái hiện tại: <strong>{statusLabel[target.status]}</strong>
        </p>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Trạng thái</label>
          <select
            className={styles.selectInput}
            value={statusAction}
            onChange={(e) => onChangeStatusAction(e.target.value as StatusAction)}
            disabled={busy}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="approve">Duyệt tin</option>
            <option value="reject">Từ chối</option>
            <option value="stop">Dừng hoạt động</option>
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Lý do từ chối <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <textarea
            value={rejectReason}
            disabled={statusAction !== "reject" || busy}
            onChange={(e) => onChangeRejectReason(e.target.value)}
            placeholder={statusAction === "reject" ? "Nhập lý do từ chối" : "Chỉ nhập khi chọn Từ chối"}
            style={{ width: "100%", marginTop: 6 }}
          />
          {statusAction === "reject" ? (
            <p className={styles.error} style={{ marginTop: 6 }}>
              {rejectReason.trim() ? "" : "Lý do từ chối bắt buộc."}
            </p>
          ) : null}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={onSubmit}>
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
