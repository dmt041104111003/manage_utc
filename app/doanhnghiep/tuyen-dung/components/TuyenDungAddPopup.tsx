import type { JobFormState } from "@/lib/types/doanhnghiep-tuyen-dung";
import TuyenDungJobFormFields from "./TuyenDungJobFormFields";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  open: boolean;
  form: JobFormState;
  fieldErrors: Record<string, string>;
  busyId: string | null;
  onChange: (updates: Partial<JobFormState>) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function TuyenDungAddPopup({ open, form, fieldErrors, busyId, onChange, onCancel, onSubmit }: Props) {
  if (!open) return null;

  return (
    <div className={adminStyles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-add-title">
      <div className={`${adminStyles.modalWide} ${adminStyles.modal}`}>
        <h2 id="job-add-title">Thêm tin tuyển dụng mới</h2>
        <TuyenDungJobFormFields
          form={form}
          fieldErrors={fieldErrors}
          disabled={busyId !== null}
          onChange={onChange}
        />
        <div className={adminStyles.modalActions}>
          <button type="button" className={adminStyles.btn} onClick={onCancel}>
            Hủy
          </button>
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            disabled={busyId !== null}
            onClick={onSubmit}
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
}
