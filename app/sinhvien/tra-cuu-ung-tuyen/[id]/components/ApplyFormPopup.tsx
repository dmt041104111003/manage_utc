import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import { SINHVIEN_TRA_CUU_UNG_TUYEN_APPLY_OPEN_TITLE } from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen-detail";
import FormPopup from "../../../../components/FormPopup";
import adminStyles from "../../../../admin/styles/dashboard.module.css";
import formStyles from "../../../../auth/styles/register.module.css";

type Props = {
  busy: boolean;
  fullName: string;
  phone: string;
  email: string;
  intro: string;
  cvFileName: string | null;
  cvMime: string | null;
  cvBase64: string | null;
  removeCv: boolean;
  fieldErrors: Record<string, string>;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onIntroChange: (v: string) => void;
  onChooseCv: (file: File | null) => void;
  onRemoveCv: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ApplyFormPopup({
  busy,
  fullName,
  phone,
  email,
  intro,
  cvFileName,
  cvMime,
  cvBase64,
  removeCv,
  fieldErrors,
  onPhoneChange,
  onEmailChange,
  onIntroChange,
  onChooseCv,
  onRemoveCv,
  onClose,
  onSubmit
}: Props) {
  return (
    <FormPopup
      open
      title={SINHVIEN_TRA_CUU_UNG_TUYEN_APPLY_OPEN_TITLE}
      size="wide"
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <button type="button" className={adminStyles.btn} disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={onSubmit}>
            Nộp hồ sơ ứng tuyển
          </button>
        </>
      }
    >
      <div className={formStyles.section}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Họ tên</label>
          <input className={formStyles.input} value={fullName} disabled />
        </div>
        <div className={formStyles.grid2}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>SĐT</label>
            <input className={formStyles.input} value={phone} onChange={(e) => onPhoneChange(e.target.value)} disabled={busy} />
            {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Email</label>
            <input className={formStyles.input} value={email} onChange={(e) => onEmailChange(e.target.value)} disabled={busy} />
            {fieldErrors.email ? <p className={formStyles.error}>{fieldErrors.email}</p> : null}
          </div>
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Thư giới thiệu bản thân</label>
          <textarea className={formStyles.textarea} value={intro} onChange={(e) => onIntroChange(e.target.value)} disabled={busy} />
          {fieldErrors.intro ? <p className={formStyles.error}>{fieldErrors.intro}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>File CV đính kèm</label>
          <input
            className={formStyles.input}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={busy}
            onChange={(e) => onChooseCv(e.target.files?.[0] ?? null)}
          />
          {cvBase64 && cvMime && cvFileName && !removeCv ? (
            <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <a className={adminStyles.detailLink} href={dataUrlFromBase64(cvMime, cvBase64)} download={cvFileName}>
                {cvFileName}
              </a>
              <button type="button" className={adminStyles.textLinkBtn} onClick={onRemoveCv}>
                Xóa file
              </button>
            </div>
          ) : null}
          {fieldErrors.cv ? <p className={formStyles.error}>{fieldErrors.cv}</p> : null}
        </div>
      </div>
    </FormPopup>
  );
}
