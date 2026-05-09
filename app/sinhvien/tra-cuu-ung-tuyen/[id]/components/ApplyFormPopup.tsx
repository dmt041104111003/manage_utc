import { SINHVIEN_TRA_CUU_UNG_TUYEN_APPLY_OPEN_TITLE } from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen-detail";
import FormPopup from "../../../../components/FormPopup";
import adminStyles from "../../../../admin/styles/dashboard.module.css";
import formStyles from "../../../../auth/styles/register.module.css";
import { useRef } from "react";

type Props = {
  busy: boolean;
  fullName: string;
  phone: string;
  email: string;
  intro: string;
  cvFileName: string | null;
  cvMime: string | null;
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
  const cvInputRef = useRef<HTMLInputElement | null>(null);

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
            <label className={formStyles.label}>
              SĐT <span className={formStyles.required}>*</span>
            </label>
            <input
              className={formStyles.input}
              value={phone}
              placeholder="Nhập số điện thoại (8–12 số)"
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={busy}
            />
            {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Email <span className={formStyles.required}>*</span>
            </label>
            <input
              className={formStyles.input}
              value={email}
              placeholder="example@domain.com"
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={busy}
            />
            {fieldErrors.email ? <p className={formStyles.error}>{fieldErrors.email}</p> : null}
          </div>
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Thư giới thiệu bản thân <span className={formStyles.required}>*</span>
          </label>
          <textarea
            className={formStyles.textarea}
            value={intro}
            placeholder="Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với vị trí này (tối đa 3000 ký tự)."
            onChange={(e) => onIntroChange(e.target.value)}
            disabled={busy}
          />
          {fieldErrors.intro ? <p className={formStyles.error}>{fieldErrors.intro}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>File CV đính kèm</label>
          <input
            className={formStyles.input}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={busy}
            ref={cvInputRef}
            onChange={(e) => onChooseCv(e.target.files?.[0] ?? null)}
          />
          {cvFileName && cvMime && !removeCv ? (
            <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#475467" }}>{cvFileName}</span>
              <button
                type="button"
                className={adminStyles.textLinkBtn}
                onClick={() => {
                  if (cvInputRef.current) cvInputRef.current.value = "";
                  onRemoveCv();
                }}
              >
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
