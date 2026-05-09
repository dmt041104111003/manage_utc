"use client";

import type { ChangeEvent } from "react";
import type { FormDataState, VnProvince, VnWard } from "@/lib/types/enterprise-register";
import {
  DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL,
  MAX_ENTERPRISE_UPLOAD_BYTES
} from "@/lib/constants/doanhnghiep";
import styles from "../../styles/register.module.css";
import BusinessFieldsCombobox from "./BusinessFieldsCombobox";

type Props = {
  form: FormDataState;
  errors: Record<string, string>;
  businessFieldOptions: string[];
  provinces: VnProvince[];
  wards: VnWard[];
  addressLoading: { provinces: boolean; wards: boolean };
  addressError: string;
  addrBusy: boolean;
  isSubmitting: boolean;
  onChangeText: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBusinessFieldsChange: (next: string[]) => void;
  onProvinceChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onWardChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBusinessLicenseChange: (file: File | null, error: string) => void;
  onCompanyLogoChange: (file: File | null, error: string) => void;
};

export default function EnterpriseInfoSection(props: Props) {
  const {
    form,
    errors,
    businessFieldOptions,
    provinces,
    wards,
    addressLoading,
    addressError,
    addrBusy,
    isSubmitting,
    onChangeText,
    onBusinessFieldsChange,
    onProvinceChange,
    onWardChange,
    onBusinessLicenseChange,
    onCompanyLogoChange
  } = props;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Thông tin doanh nghiệp</h3>

      <div className={styles.field}>
        <label className={styles.label}>
          Tên doanh nghiệp <span className={styles.required}>*</span>
        </label>
        <input
          disabled={isSubmitting}
          name="companyName"
          className={styles.input}
          placeholder="Nhập tên doanh nghiệp"
          value={form.companyName}
          onChange={onChangeText}
        />
        {errors.companyName ? <p className={styles.error}>{errors.companyName}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Mã số thuế <span className={styles.required}>*</span>
        </label>
        <input
          disabled={isSubmitting}
          name="taxCode"
          className={styles.input}
          placeholder="Nhập mã số thuế"
          value={form.taxCode}
          onChange={onChangeText}
        />
        {errors.taxCode ? <p className={styles.error}>{errors.taxCode}</p> : null}
      </div>

      <div className={styles.field}>
        <label id="business-fields-label" className={styles.label}>
          Lĩnh vực hoạt động <span className={styles.required}>*</span>
        </label>
        <BusinessFieldsCombobox
          labelId="business-fields-label"
          value={form.businessFields}
          options={businessFieldOptions}
          onChange={onBusinessFieldsChange}
          disabled={isSubmitting}
          placeholder="Chọn ngành/khoa phù hợp"
        />
        {errors.businessFields ? <p className={styles.error}>{errors.businessFields}</p> : null}
      </div>

      <h4 className={styles.sectionTitle} style={{ marginTop: "1.25rem", fontSize: "1rem" }}>
        Địa chỉ trụ sở chính
      </h4>
      {addressError ? <p className={styles.error}>{addressError}</p> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>
            Tỉnh thành <span className={styles.required}>*</span>
          </label>
          <select
            disabled={isSubmitting || addressLoading.provinces}
            className={styles.select}
            value={form.provinceCode}
            onChange={onProvinceChange}
          >
            <option value="">{addressLoading.provinces ? "Đang tải…" : "Chọn tỉnh thành"}</option>
            {provinces.map((p) => (
              <option key={p.code} value={String(p.code)}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.province ? <p className={styles.error}>{errors.province}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Phường xã <span className={styles.required}>*</span>
          </label>
          <select
            disabled={isSubmitting || !form.provinceCode || addressLoading.wards}
            className={styles.select}
            value={form.wardCode}
            onChange={onWardChange}
          >
            <option value="">
              {!form.provinceCode ? "Chọn tỉnh trước" : addressLoading.wards ? "Đang tải…" : "Chọn phường xã"}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={String(w.code)}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.ward ? <p className={styles.error}>{errors.ward}</p> : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Địa chỉ chi tiết <span className={styles.required}>*</span>
        </label>
        <input
          disabled={isSubmitting}
          name="addressDetail"
          className={styles.input}
          placeholder="Số nhà, ngõ, đường (chỉ chữ, số, khoảng trắng)"
          value={form.addressDetail}
          onChange={onChangeText}
        />
    
        {errors.addressDetail ? <p className={styles.error}>{errors.addressDetail}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Giấy phép kinh doanh <span className={styles.required}>*</span>
        </label>
        <input
          type="file"
          disabled={isSubmitting || addrBusy}
          className={styles.input}
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            const err = f && f.size > MAX_ENTERPRISE_UPLOAD_BYTES ? `Giấy phép tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.` : "";
            onBusinessLicenseChange(f, err);
          }}
        />
        <p className={styles.hint}>Định dạng PDF hoặc Word (.doc, .docx); tối đa {DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL}.</p>
        {errors.businessLicense ? <p className={styles.error}>{errors.businessLicense}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Logo công ty <span className={styles.required}>*</span>
        </label>
        <input
          type="file"
          disabled={isSubmitting || addrBusy}
          className={styles.input}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            const err = f && f.size > MAX_ENTERPRISE_UPLOAD_BYTES ? `Logo tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.` : "";
            onCompanyLogoChange(f, err);
          }}
        />
        <p className={styles.hint}>File ảnh (JPG, PNG, WebP, GIF); tối đa {DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL}.</p>
        {errors.companyLogo ? <p className={styles.error}>{errors.companyLogo}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Website (nếu có)</label>
        <input
          disabled={isSubmitting}
          name="website"
          className={styles.input}
          placeholder="https://company.vn"
          value={form.website}
          onChange={onChangeText}
        />
        {errors.website ? <p className={styles.error}>{errors.website}</p> : null}
      </div>
    </section>
  );
}
