import FormPopup from "../../../components/FormPopup";
import type { Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  reviewTarget: Row | null;
  busy: boolean;
  evaluation: string;
  dqtPoint: string;
  kthpPoint: string;
  rejectReason: string;
  onEvaluationChange: (v: string) => void;
  onDqtPointChange: (v: string) => void;
  onKthpPointChange: (v: string) => void;
  onRejectReasonChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
};

export default function BaoCaoReviewPopup({
  reviewTarget,
  busy,
  evaluation,
  dqtPoint,
  kthpPoint,
  rejectReason,
  onEvaluationChange,
  onDqtPointChange,
  onKthpPointChange,
  onRejectReasonChange,
  onApprove,
  onReject,
  onClose
}: Props) {
  if (!reviewTarget || !reviewTarget.report) return null;

  return (
    <FormPopup
      open
      title="Duyệt BCTT"
      size="extraWide"
      busy={busy}
      onClose={() => { if (!busy) onClose(); }}
      actions={
        <button type="button" className={adminStyles.btn} disabled={busy} onClick={onClose}>
          Hủy
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <table className={adminStyles.viewModalDetailTable}>
            <tbody>
              <tr><th scope="row">MSV</th><td>{reviewTarget.msv}</td></tr>
              <tr><th scope="row">Họ tên</th><td>{reviewTarget.fullName}</td></tr>
              <tr><th scope="row">Lớp</th><td>{reviewTarget.className}</td></tr>
              <tr><th scope="row">Khoa</th><td>{reviewTarget.faculty}</td></tr>
              <tr><th scope="row">Khóa</th><td>{reviewTarget.cohort}</td></tr>
              <tr><th scope="row">Bậc</th><td>{degreeLabel[reviewTarget.degree]}</td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>File BCTT</div>
            <a
              className={adminStyles.detailLink}
              href={dataUrlFromBase64(reviewTarget.report.reportMime, reviewTarget.report.reportBase64)}
              download={reviewTarget.report.reportFileName}
            >
              Tải BCTT: {reviewTarget.report.reportFileName}
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className={formStyles.label}>Đánh giá</label>
            <textarea
              className={formStyles.textarea}
              value={evaluation}
              onChange={(e) => onEvaluationChange(e.target.value)}
              disabled={busy}
              placeholder="Không bắt buộc"
              style={{ width: "100%", minHeight: 100, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className={formStyles.label}>ĐQT</label>
              <input
                className={formStyles.input}
                value={dqtPoint}
                onChange={(e) => onDqtPointChange(e.target.value)}
                disabled={busy}
                placeholder="1-10"
              />
            </div>
            <div>
              <label className={formStyles.label}>KTHP</label>
              <input
                className={formStyles.input}
                value={kthpPoint}
                onChange={(e) => onKthpPointChange(e.target.value)}
                disabled={busy || !reviewTarget.enterprise}
                placeholder={reviewTarget.enterprise ? "1-10" : "—"}
              />
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>
              Lý do từ chối (bắt buộc nếu Từ chối)
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              disabled={busy}
              style={{
                width: "100%",
                minHeight: 110,
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
              disabled={busy}
              onClick={onApprove}
            >
              Duyệt
            </button>
            <button type="button" className={adminStyles.btn} disabled={busy} onClick={onReject}>
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </FormPopup>
  );
}
