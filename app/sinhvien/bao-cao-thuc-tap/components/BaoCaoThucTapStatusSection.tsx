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
        <button
          type="button"
          className={`${adminStyles.btn} ${canSubmitReport ? adminStyles.btnPrimary : ""}`}
          disabled={!canSubmitReport || busy}
          onClick={canSubmitReport ? onOpenUpload : undefined}
          title={
            !canSubmitReport && !hasReport
              ? "Chỉ nộp được khi đang thực tập"
              : hasReport
              ? "Đã nộp BCTT"
              : undefined
          }
        >
          Nộp BCTT
        </button>

        {hasReport ? (
          <button
            type="button"
            className={adminStyles.btn}
            disabled={!canEditReport || busy}
            onClick={canEditReport ? onOpenEdit : undefined}
            title={!canEditReport ? "Chỉ sửa được khi GVHD từ chối duyệt" : undefined}
          >
            Sửa BCTT
          </button>
        ) : null}
      </div>
    </section>
  );
}
