import FormPopup from "../../../components/FormPopup";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  busy: boolean;
  fieldError: string;
  onChooseFile: (file: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function BaoCaoThucTapUploadPopup({ busy, fieldError, onChooseFile, onClose, onSubmit }: Props) {
  return (
    <FormPopup
      open
      title="Nộp BCTT"
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
            Nộp BCTT
          </button>
        </>
      }
    >
      <div className={formStyles.field}>
        <label className={formStyles.label}>File BCTT (PDF hoặc DOCX)</label>
        <input
          className={formStyles.input}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
        />
        {fieldError ? <p className={formStyles.error}>{fieldError}</p> : null}
      </div>
    </FormPopup>
  );
}
