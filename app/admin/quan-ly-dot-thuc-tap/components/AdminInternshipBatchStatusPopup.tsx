"use client";

import type { InternshipBatchRow } from "@/lib/types/admin-quan-ly-dot-thuc-tap";
import { getTodayStart } from "@/lib/utils/admin-quan-ly-dot-thuc-tap-dates";

import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  statusTarget: InternshipBatchRow | null;
  busy: boolean;
  onClose: () => void;
  onConfirmClose: () => void;
};

export default function AdminInternshipBatchStatusPopup(props: Props) {
  const { statusTarget, busy, onClose, onConfirmClose } = props;
  if (!statusTarget) return null;

  const today = getTodayStart();
  const end = statusTarget.endDate ? new Date(statusTarget.endDate) : null;
  const tooLate = !end ? false : end.getTime() > today.getTime();
  const msg = tooLate
    ? "Chưa quá hạn thời gian đợt thực tập, xác nhận đóng kỳ thực tập?"
    : "Đợt thực tập sẽ chuyển trạng thái Đóng.";

  return (
    <MessagePopup
      open
      title="Cập nhật trạng thái đợt thực tập"
      size="wide"
      onClose={onClose}
      actions={
        <>
          <button type="button" className={styles.btn} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy} onClick={onConfirmClose}>
            Đóng
          </button>
        </>
      }
    >
      <p>{msg}</p>
    </MessagePopup>
  );
}

