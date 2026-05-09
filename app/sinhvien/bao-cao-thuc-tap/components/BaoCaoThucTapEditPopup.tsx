import type { Report } from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import FormPopup from "../../../components/FormPopup";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  busy: boolean;
  report: Report | null;
  reportFileLink: string | null;
  selectedFileBase64: string | null;
  deleteLocalFile: boolean;
  fieldError: string;
  onChooseFile: (file: File | null) => void;
  onDeleteFile: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function BaoCaoThucTapEditPopup({
  busy,
  report,
  reportFileLink,
  selectedFileBase64,
  deleteLocalFile,
  fieldError,
  onChooseFile,
  onDeleteFile,
  onClose,
  onSubmit
}: Props) {
  return (
    <FormPopup
      open
      title="Sửa BCTT"
      size="wide"
      busy={busy}
      onClose={() => { if (!busy) onClose(); }}
      actions={
        <>
          <button type="button" className={adminStyles.btn} disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            disabled={busy}
            onClick={onSubmit}
          >
            Lưu
          </button>
        </>
      }
    >
      <div className={formStyles.field}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          Lý do GVHD từ chối:
          <div style={{ marginTop: 4, whiteSpace: "pre-wrap", color: "#111827", fontWeight: 600 }}>
            {report?.supervisorRejectReason ?? "—"}
          </div>
        </div>

        <label className={formStyles.label}>File BCTT mới (PDF hoặc DOCX)</label>
        <input
          className={formStyles.input}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
        />

        {report && reportFileLink && !selectedFileBase64 && !deleteLocalFile ? (
          <div style={{ marginTop: 10 }}>
            <a className={adminStyles.detailLink} href={reportFileLink} download={report.reportFileName}>
              Tải file hiện tại
            </a>
            <button type="button" className={adminStyles.textLinkBtn} disabled={busy} onClick={onDeleteFile}>
              Xóa file
            </button>
          </div>
        ) : null}

        {fieldError ? <p className={formStyles.error}>{fieldError}</p> : null}
      </div>
    </FormPopup>
  );
}
