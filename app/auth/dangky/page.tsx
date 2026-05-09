"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/register.module.css";
import {
  DOANHNGHIEP_BUSINESS_FIELD_OPTIONS,
  DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL,
  MAX_ENTERPRISE_UPLOAD_BYTES
} from "@/lib/constants/doanhnghiep";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import { DEMO_ENTERPRISE_REGISTER_FORM } from "./demo-register-data";

type VnProvince = { code: number; name: string };
type VnWard = { code: number; name: string };

type FormDataState = {
  companyName: string;
  taxCode: string;
  businessFields: string[];
  provinceCode: string;
  wardCode: string;
  provinceName: string;
  wardName: string;
  addressDetail: string;
  website: string;
  representativeName: string;
  representativeTitle: string;
  phone: string;
  email: string;
};

const EMPTY_FORM: FormDataState = {
  companyName: "",
  taxCode: "",
  businessFields: [],
  provinceCode: "",
  wardCode: "",
  provinceName: "",
  wardName: "",
  addressDetail: "",
  website: "",
  representativeName: "",
  representativeTitle: "",
  phone: "",
  email: ""
};

function initialRegisterForm(): FormDataState {
  if (process.env.NEXT_PUBLIC_PREFILL_REGISTER === "1") {
    return { ...EMPTY_FORM, ...DEMO_ENTERPRISE_REGISTER_FORM };
  }
  return EMPTY_FORM;
}

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormDataState>(initialRegisterForm);
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);
  const [addressLoading, setAddressLoading] = useState({ provinces: true, wards: false });
  const [addressError, setAddressError] = useState("");
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = useCallback((field: keyof FormDataState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAddressLoading((s) => ({ ...s, provinces: true }));
      setAddressError("");
      try {
        const res = await fetch("/api/vn-address/provinces");
        const data = (await res.json()) as { provinces?: VnProvince[]; message?: string };
        if (!res.ok) throw new Error(data.message || "Không tải được tỉnh thành.");
        if (!cancelled) setProvinces(data.provinces || []);
      } catch (e) {
        if (!cancelled) setAddressError(e instanceof Error ? e.message : "Lỗi tải danh mục địa giới.");
      } finally {
        if (!cancelled) setAddressLoading((s) => ({ ...s, provinces: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadWards = useCallback(async (provinceCode: string) => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    setAddressLoading((s) => ({ ...s, wards: true }));
    setAddressError("");
    try {
      const res = await fetch(`/api/vn-address/provinces/${provinceCode}/wards`);
      const data = (await res.json()) as { wards?: VnWard[]; message?: string };
      if (!res.ok) throw new Error(data.message || "Không tải được phường xã.");
      setWards(data.wards || []);
    } catch (e) {
      setAddressError(e instanceof Error ? e.message : "Lỗi tải phường xã.");
      setWards([]);
    } finally {
      setAddressLoading((s) => ({ ...s, wards: false }));
    }
  }, []);

  useEffect(() => {
    if (!form.provinceCode) {
      setWards([]);
      return;
    }
    void loadWards(form.provinceCode);
  }, [form.provinceCode, loadWards]);

  const onChangeText = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setField(name as keyof FormDataState, value);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onChangeBusinessFields = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((item) => item.value);
    setField("businessFields", selected);
    setErrors((prev) => ({ ...prev, businessFields: "" }));
  };

  const onProvinceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const code = event.target.value;
    const opt = event.target.selectedOptions[0];
    const name = opt?.text || "";
    setForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: code ? name : "",
      wardCode: "",
      wardName: ""
    }));
    setErrors((prev) => ({ ...prev, province: "", ward: "" }));
  };

  const onWardChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const code = event.target.value;
    const opt = event.target.selectedOptions[0];
    const name = opt?.text || "";
    setForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: code ? name : ""
    }));
    setErrors((prev) => ({ ...prev, ward: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const addressPattern = /^[\p{L}\d\s]{1,255}$/u;
    const letterOnly = /^[\p{L}\s]{1,255}$/u;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w./?%&=-]*)?$/i;

    if (!form.companyName || form.companyName.length > 255) {
      nextErrors.companyName = "Tên doanh nghiệp từ 1-255 ký tự.";
    }
    if (!/^\d{10,15}$/.test(form.taxCode)) {
      nextErrors.taxCode = "Mã số thuế chỉ gồm số, dài 10-15 ký tự.";
    }
    if (!form.businessFields.length) {
      nextErrors.businessFields = "Vui lòng chọn ít nhất 1 lĩnh vực hoạt động.";
    }
    if (!form.provinceCode || !form.provinceName) {
      nextErrors.province = "Vui lòng chọn tỉnh thành.";
    }
    if (!form.wardCode || !form.wardName) {
      nextErrors.ward = "Vui lòng chọn phường xã.";
    }
    if (!addressPattern.test(form.addressDetail)) {
      nextErrors.addressDetail =
        "Địa chỉ chi tiết chỉ gồm chữ, số và khoảng trắng (không ký tự đặc biệt), dài 1-255 ký tự.";
    }
    if (!businessLicense) nextErrors.businessLicense = "Vui lòng đính kèm giấy phép kinh doanh.";
    else if (businessLicense.size > MAX_ENTERPRISE_UPLOAD_BYTES) {
      nextErrors.businessLicense = `Giấy phép tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.`;
    }
    if (!companyLogo) nextErrors.companyLogo = "Vui lòng tải lên logo công ty.";
    else if (companyLogo.size > MAX_ENTERPRISE_UPLOAD_BYTES) {
      nextErrors.companyLogo = `Logo tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.`;
    }
    if (form.website && !websiteRegex.test(form.website)) nextErrors.website = "Website không đúng định dạng.";
    if (!letterOnly.test(form.representativeName)) {
      nextErrors.representativeName = "Họ và tên chỉ gồm ký tự chữ, dài 1-255.";
    }
    if (!letterOnly.test(form.representativeTitle)) {
      nextErrors.representativeTitle = "Chức vụ chỉ gồm ký tự chữ, dài 1-255.";
    }
    if (!/^\d{8,12}$/.test(form.phone)) nextErrors.phone = "Số điện thoại chỉ gồm số, dài 8-12 ký tự.";
    if (!emailRegex.test(form.email)) nextErrors.email = "Email phải đúng định dạng example@domain.com.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const [licensePayload, logoPayload] = await Promise.all([
        readFileAsBase64Payload(businessLicense!),
        readFileAsBase64Payload(companyLogo!)
      ]);
      const {
        provinceCode,
        wardCode,
        provinceName,
        wardName,
        companyName,
        taxCode,
        businessFields,
        addressDetail,
        website,
        representativeName,
        representativeTitle,
        phone,
        email
      } = form;
      const response = await fetch("/api/auth/register-enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          taxCode,
          businessFields,
          province: provinceName,
          ward: wardName,
          provinceCode,
          wardCode,
          addressDetail,
          website,
          representativeName,
          representativeTitle,
          phone,
          email,
          businessLicenseName: businessLicense?.name || "",
          businessLicenseMime: licensePayload.mime,
          businessLicenseBase64: licensePayload.base64,
          companyLogoName: companyLogo?.name || "",
          companyLogoMime: logoPayload.mime,
          companyLogoBase64: logoPayload.base64
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors((prev) => ({ ...prev, [data.field || "submit"]: data.message || "Đăng ký thất bại." }));
        if (!data.field) setSubmitError(data.message || "Đăng ký thất bại.");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      router.replace(typeof data.redirectPath === "string" ? data.redirectPath : "/auth/dangky");
    } catch (err) {
      if (err instanceof Error && err.message === "invalid data URL") {
        setSubmitError("Không đọc được file đính kèm. Vui lòng chọn file khác.");
      } else {
        setSubmitError("Không thể kết nối hệ thống. Vui lòng thử lại.");
      }
      setIsSubmitting(false);
    }
  };

  const addrBusy = addressLoading.provinces || addressLoading.wards;

  return (
    <AuthShell variant="centeredWide">
      <h2 className={styles.title}>Đăng ký doanh nghiệp</h2>
      <p className={styles.desc}>Tạo tài khoản doanh nghiệp để kết nối thực tập với nhà trường.</p>

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
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
            <label className={styles.label}>
              Lĩnh vực hoạt động <span className={styles.required}>*</span>
            </label>
            <select
              multiple
              disabled={isSubmitting}
              className={styles.multiSelect}
              value={form.businessFields}
              onChange={onChangeBusinessFields}
            >
              {DOANHNGHIEP_BUSINESS_FIELD_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <p className={styles.hint}>Giữ Ctrl (hoặc Cmd trên Mac) để chọn nhiều lĩnh vực.</p>
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
                  {!form.provinceCode
                    ? "Chọn tỉnh trước"
                    : addressLoading.wards
                      ? "Đang tải…"
                      : "Chọn phường xã"}
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
            <p className={styles.hint}>
              Có thể là địa chỉ sau khi sáp nhập địa giới hoặc trước sáp nhập. Chỉ nhập chữ, số và khoảng trắng (không
              ký tự đặc biệt).
            </p>
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
              onChange={(event) => {
                const f = event.target.files?.[0] || null;
                setBusinessLicense(f);
                setErrors((prev) => ({ ...prev, businessLicense: "" }));
                if (f && f.size > MAX_ENTERPRISE_UPLOAD_BYTES) {
                  setErrors((prev) => ({
                    ...prev,
                    businessLicense: `Giấy phép tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.`
                  }));
                }
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
              onChange={(event) => {
                const f = event.target.files?.[0] || null;
                setCompanyLogo(f);
                setErrors((prev) => ({ ...prev, companyLogo: "" }));
                if (f && f.size > MAX_ENTERPRISE_UPLOAD_BYTES) {
                  setErrors((prev) => ({
                    ...prev,
                    companyLogo: `Logo tối đa ${DOANHNGHIEP_MAX_UPLOAD_FILE_LABEL} / file.`
                  }));
                }
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

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông tin Người đại diện/Liên hệ</h3>
          <div className={styles.field}>
            <label className={styles.label}>
              Họ và tên <span className={styles.required}>*</span>
            </label>
            <input
              disabled={isSubmitting}
              name="representativeName"
              className={styles.input}
              placeholder="Nhập họ và tên"
              value={form.representativeName}
              onChange={onChangeText}
            />
            {errors.representativeName ? <p className={styles.error}>{errors.representativeName}</p> : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Chức vụ <span className={styles.required}>*</span>
            </label>
            <input
              disabled={isSubmitting}
              name="representativeTitle"
              className={styles.input}
              placeholder="Nhập chức vụ"
              value={form.representativeTitle}
              onChange={onChangeText}
            />
            {errors.representativeTitle ? <p className={styles.error}>{errors.representativeTitle}</p> : null}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Số điện thoại <span className={styles.required}>*</span>
              </label>
              <input
                disabled={isSubmitting}
                name="phone"
                className={styles.input}
                placeholder="Nhập số điện thoại"
                value={form.phone}
                onChange={onChangeText}
              />
              {errors.phone ? <p className={styles.error}>{errors.phone}</p> : null}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                disabled={isSubmitting}
                name="email"
                type="email"
                autoComplete="email"
                className={styles.input}
                placeholder="example@domain.com"
                value={form.email}
                onChange={onChangeText}
              />
              {errors.email ? <p className={styles.error}>{errors.email}</p> : null}
            </div>
          </div>
        </section>

        <button className={styles.button} type="submit" disabled={isSubmitting || addrBusy}>
          {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>

      {submitError ? <p className={styles.errorGlobal}>{submitError}</p> : null}

      <div className={styles.linkRow}>
        <Link href="/auth/dangnhap">Quay lại đăng nhập</Link>
      </div>
    </AuthShell>
  );
}
