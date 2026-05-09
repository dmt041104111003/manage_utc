import type { EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type FormState = EnterpriseAccountFormState;

type Props = {
  isEditing: boolean;
  saving: boolean;
  form: FormState;
  fieldErrors: Record<string, string>;
  onSetField: (key: keyof FormState, value: string | string[]) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
};

export default function EnterpriseAccountEditSection({
  isEditing,
  saving,
  form,
  fieldErrors,
  onSetField,
  onStartEdit,
  onCancelEdit
}: Props) {
  if (isEditing) {
    return (
      <>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Tên người đại diện</label>
          <input
            className={formStyles.input}
            disabled={saving}
            value={form.representativeName}
            onChange={(e) => onSetField("representativeName", e.target.value)}
            placeholder="Nhập họ và tên"
          />
          {fieldErrors.representativeName ? <p className={formStyles.error}>{fieldErrors.representativeName}</p> : null}
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Chức vụ</label>
          <input
            className={formStyles.input}
            disabled={saving}
            value={form.representativeTitle}
            onChange={(e) => onSetField("representativeTitle", e.target.value)}
            placeholder="Nhập chức vụ"
          />
          {fieldErrors.representativeTitle ? <p className={formStyles.error}>{fieldErrors.representativeTitle}</p> : null}
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Giới thiệu về doanh nghiệp</label>
          <textarea
            disabled={saving}
            className={formStyles.textarea}
            value={form.companyIntro}
            onChange={(e) => onSetField("companyIntro", e.target.value)}
            placeholder="Nhập giới thiệu ngắn về doanh nghiệp"
          />
          {fieldErrors.companyIntro ? <p className={formStyles.error}>{fieldErrors.companyIntro}</p> : null}
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Website công ty</label>
          <input
            className={formStyles.input}
            disabled={saving}
            value={form.website}
            onChange={(e) => onSetField("website", e.target.value)}
            placeholder="https://company.vn"
          />
          {fieldErrors.website ? <p className={formStyles.error}>{fieldErrors.website}</p> : null}
        </div>

        <div className={formStyles.section} style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className={adminStyles.btn} onClick={onCancelEdit} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={saving}>
            {saving ? "Đang cập nhật…" : "Lưu thay đổi"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Tên người đại diện</th>
            <td>{form.representativeName || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Chức vụ</th>
            <td>{form.representativeTitle || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Giới thiệu về doanh nghiệp</th>
            <td>{form.companyIntro || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Website công ty</th>
            <td>{form.website || "—"}</td>
          </tr>
        </tbody>
      </table>
      <div className={formStyles.section} style={{ marginTop: 18 }}>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={onStartEdit}>
          Sửa
        </button>
      </div>
    </>
  );
}
