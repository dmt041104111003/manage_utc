"use client";

import { EnterpriseStatus } from "@prisma/client";
import type { AdminEnterpriseDetail, AdminEnterpriseListItem } from "@/lib/types/admin";
import { buildEnterpriseHeadquartersAddress, normalizeEnterpriseStatus } from "@/lib/utils/enterprise-admin-display";

import { EnterpriseStatusCell } from "../../components/EnterpriseStatusCell";
import MessagePopup from "../../../components/MessagePopup";

import styles from "../../styles/dashboard.module.css";

type Props = {
  statusTarget: AdminEnterpriseListItem | null;
  statusDetail: AdminEnterpriseDetail | null;
  rejectOpen: boolean;
  rejectText: string;
  rejectTextError: string;
  busyId: string | null;

  onClose: () => void;
  onStartReject: () => void;
  onSubmitApprove: () => void;
  onSubmitReject: () => void;

  onChangeRejectText: (v: string) => void;
  onBackFromReject: () => void;
};

export default function AdminEnterpriseStatusPopup(props: Props) {
  const {
    statusTarget,
    statusDetail,
    rejectOpen,
    rejectText,
    rejectTextError,
    busyId,
    onClose,
    onStartReject,
    onSubmitApprove,
    onSubmitReject,
    onChangeRejectText,
    onBackFromReject
  } = props;

  if (!statusTarget) return null;

  const isRejected = normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.REJECTED;
  const isApproved = normalizeEnterpriseStatus(statusTarget.enterpriseStatus) === EnterpriseStatus.APPROVED;

  return (
    <MessagePopup open title="Cập nhật trạng thái phê duyệt" size="wide">
      {!rejectOpen ? (
        <>
          <div className={styles.statusCurrentRow}>
            <strong>Trạng thái hiện tại:</strong> <EnterpriseStatusCell status={statusTarget.enterpriseStatus} />
          </div>
          <p>
            <strong>Tên doanh nghiệp:</strong> {statusTarget.companyName || "—"}
            <br />
            <strong>Mã số thuế:</strong> {statusTarget.taxCode || "—"}
            <br />
            <strong>Email:</strong> {statusTarget.email}
            <br />
            <strong>Địa chỉ:</strong>{" "}
            {statusDetail ? buildEnterpriseHeadquartersAddress(statusDetail.enterpriseMeta) : "Đang tải…"}
          </p>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btn} onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              disabled={busyId !== null || isRejected}
              title={isRejected ? "Hồ sơ đã bị từ chối — không thể từ chối thêm lần nữa." : undefined}
              onClick={onStartReject}
            >
              Từ chối
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={busyId !== null || isApproved}
              title={isApproved ? "Hồ sơ đã được phê duyệt — không cần phê duyệt lại." : undefined}
              onClick={onSubmitApprove}
            >
              Phê duyệt
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong>Từ chối:</strong> {statusTarget.companyName || "—"} — MST {statusTarget.taxCode || "—"}
          </p>
          <p>Lý do từ chối (mỗi dòng một ý, hiển thị trong email).</p>
          <textarea
            value={rejectText}
            disabled={busyId !== null}
            onChange={(e) => onChangeRejectText(e.target.value)}
            placeholder="Ví dụ: Hồ sơ chưa đầy đủ."
          />
          {rejectTextError ? (
            <p className={styles.error} style={{ marginTop: 6 }}>
              {rejectTextError}
            </p>
          ) : null}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btn} onClick={onBackFromReject}>
              Quay lại
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              disabled={busyId !== null}
              onClick={() => void onSubmitReject()}
            >
              Gửi từ chối
            </button>
          </div>
        </>
      )}
    </MessagePopup>
  );
}

