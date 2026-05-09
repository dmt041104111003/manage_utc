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
  const canToggleActive = isApproved;
  const activeLabel = statusTarget.isLocked ? "Đang hoạt động" : "Dừng hoạt động";

  return (
    <MessagePopup open title="Cập nhật trạng thái phê duyệt" size="wide">
      {!rejectOpen ? (
        <>
          <div className={styles.statusCurrentRow}>
            <strong>Trạng thái hiện tại:</strong>{" "}
            <EnterpriseStatusCell status={statusTarget.enterpriseStatus} isLocked={statusTarget.isLocked} />
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
            {canToggleActive ? (
              <button
                type="button"
                className={`${styles.btn} ${statusTarget.isLocked ? styles.btnPrimary : styles.btnDanger}`}
                disabled={busyId !== null}
                title={
                  statusTarget.isLocked
                    ? "Doanh nghiệp đang dừng hoạt động — chỉ có thể kích hoạt lại."
                    : "Doanh nghiệp đã phê duyệt — chỉ có thể cập nhật sang dừng hoạt động."
                }
                onClick={() => {
                  const next = statusTarget.isLocked ? "ACTIVE" : "STOPPED";
                  const ok = window.confirm(`Xác nhận cập nhật trạng thái tài khoản doanh nghiệp sang "${activeLabel}"?`);
                  if (!ok) return;
                  void (async () => {
                    // use accounts status endpoint (locks/unlocks user)
                    try {
                      const res = await fetch(`/api/admin/accounts/${statusTarget.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: next })
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data?.message || "Cập nhật trạng thái thất bại.");
                        return;
                      }
                      window.location.reload();
                    } catch {
                      alert("Không thể kết nối hệ thống. Vui lòng thử lại.");
                    }
                  })();
                }}
              >
                {activeLabel}
              </button>
            ) : (
              <>
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
              </>
            )}
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

