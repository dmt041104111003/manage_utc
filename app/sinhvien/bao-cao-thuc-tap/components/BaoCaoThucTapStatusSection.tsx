import type { InternshipStatus } from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import { internshipStatusLabel } from "@/lib/constants/sinhvien-bao-cao-thuc-tap";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  internshipStatus: InternshipStatus;
  statusHint: string;
  canSubmitReport: boolean;
  canEditReport: boolean;
  hasReport: boolean;
  busy: boolean;
  onOpenUpload: () => void;
  onOpenEdit: () => void;
};

export default function BaoCaoThucTapStatusSection({
  internshipStatus,
  statusHint,
  canSubmitReport,
  canEditReport,
  hasReport,
  busy,
  onOpenUpload,
  onOpenEdit
}: Props) {
  return (
    <section className={adminStyles.detailCard} style={{ padding: "20px 22px", maxWidth: "none" }}>
      <div className={adminStyles.detailSectionTitle}>Trạng thái thực tập</div>
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Trạng thái hiện tại</th>
            <td>{internshipStatusLabel[internshipStatus]}</td>
          </tr>
          <tr>
            <th scope="row">Ghi chú</th>
            <td>{statusHint}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {internshipStatus === "DOING" || internshipStatus === "SELF_FINANCED" ? (
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            disabled={!canSubmitReport || busy}
            onClick={onOpenUpload}
          >
            Nộp BCTT
          </button>
        ) : (
          <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled>
            Nộp BCTT
          </button>
        )}

        {hasReport ? (
          canEditReport ? (
            <button type="button" className={adminStyles.btn} disabled={busy} onClick={onOpenEdit}>
              Sửa BCTT
            </button>
          ) : (
            <button type="button" className={adminStyles.btn} disabled>
              Sửa BCTT
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}
