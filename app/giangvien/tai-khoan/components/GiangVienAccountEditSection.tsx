import type { Degree, GiangVienMe, Province, Ward } from "@/lib/types/giangvien-tai-khoan";
import { DEGREE_ALLOWED, degreeLabel } from "@/lib/constants/giangvien-tai-khoan";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  me: GiangVienMe;
  isEditing: boolean;
  saving: boolean;
  phone: string;
  degree: Degree;
  provinceCode: string;
  wardCode: string;
  provinces: Province[];
  wards: Ward[];
  wardLoading: boolean;
  fieldErrors: Record<string, string>;
  onPhoneChange: (v: string) => void;
  onDegreeChange: (v: Degree) => void;
  onProvinceCodeChange: (v: string) => void;
  onWardCodeChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
};

export default function GiangVienAccountEditSection({
  me,
  isEditing,
  saving,
  phone,
  degree,
  provinceCode,
  wardCode,
  provinces,
  wards,
  wardLoading,
  fieldErrors,
  onPhoneChange,
  onDegreeChange,
  onProvinceCodeChange,
  onWardCodeChange,
  onStartEdit,
  onCancelEdit
}: Props) {
  if (isEditing) {
    return (
      <>
        <div className={formStyles.grid2} style={{ marginTop: 8 }}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>SĐT</label>
            <input
              className={formStyles.input}
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="Nhập số điện thoại"
              disabled={saving}
            />
            {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Bậc</label>
            <select
              className={formStyles.select}
              value={degree}
              onChange={(e) => onDegreeChange(e.target.value as Degree)}
              disabled={saving}
            >
              {DEGREE_ALLOWED.map((d) => (
                <option key={d} value={d}>{degreeLabel[d]}</option>
              ))}
            </select>
            {fieldErrors.degree ? <p className={formStyles.error}>{fieldErrors.degree}</p> : null}
          </div>
        </div>

        <div className={formStyles.grid2} style={{ marginTop: 0 }}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Địa chỉ thường trú - Tỉnh/Thành</label>
            <select
              className={formStyles.select}
              value={provinceCode}
              onChange={(e) => onProvinceCodeChange(e.target.value)}
              disabled={saving}
            >
              <option value="">Chọn tỉnh/thành</option>
              {provinces.map((p) => (
                <option key={p.code} value={String(p.code)}>{p.name}</option>
              ))}
            </select>
            {fieldErrors.permanentProvinceCode ? <p className={formStyles.error}>{fieldErrors.permanentProvinceCode}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Địa chỉ thường trú - Phường/Xã</label>
            <select
              className={formStyles.select}
              value={wardCode}
              onChange={(e) => onWardCodeChange(e.target.value)}
              disabled={!provinceCode || wardLoading || saving}
            >
              <option value="">
                {wardLoading ? "Đang tải…" : !provinceCode ? "Chọn tỉnh trước" : "Chọn phường/xã"}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={String(w.code)}>{w.name}</option>
              ))}
            </select>
            {fieldErrors.permanentWardCode ? <p className={formStyles.error}>{fieldErrors.permanentWardCode}</p> : null}
          </div>
        </div>

        <div className={formStyles.section} style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className={adminStyles.btn} onClick={onCancelEdit} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={saving}>
            {saving ? "Đang cập nhật…" : "Cập nhật"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <th scope="row">SĐT</th>
            <td>{phone || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Bậc</th>
            <td>{degreeLabel[degree]}</td>
          </tr>
          <tr>
            <th scope="row">Địa chỉ thường trú</th>
            <td>{[me.permanentProvinceName, me.permanentWardName].filter(Boolean).join(" - ") || "—"}</td>
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
