"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/register.module.css";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import { DEMO_ENTERPRISE_REGISTER_FORM } from "./demo-register-data";
import type { FormDataState, VnProvince, VnWard } from "@/lib/types/enterprise-register";
import { EMPTY_ENTERPRISE_REGISTER_FORM } from "@/lib/constants/auth/enterprise-register";
import { getInitialRegisterForm, validateEnterpriseRegisterForm } from "@/lib/utils/auth/enterprise-register";
import { DOANHNGHIEP_BUSINESS_FIELD_OPTIONS } from "@/lib/constants/doanhnghiep";
import EnterpriseInfoSection from "./components/EnterpriseInfoSection";
import RepresentativeSection from "./components/RepresentativeSection";

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormDataState>(() =>
    getInitialRegisterForm(EMPTY_ENTERPRISE_REGISTER_FORM, DEMO_ENTERPRISE_REGISTER_FORM, process.env.NEXT_PUBLIC_PREFILL_REGISTER)
  );
  const [facultyOptions, setFacultyOptions] = useState<string[]>([]);
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
      try {
        const res = await fetch("/api/public/faculties");
        const data = (await res.json()) as { success?: boolean; faculties?: string[] };
        if (!res.ok) return;
        const items = Array.isArray(data.faculties) ? data.faculties.filter(Boolean) : [];
        if (!cancelled) setFacultyOptions(items);
      } catch {
        if (!cancelled) setFacultyOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const onBusinessFieldsChange = (next: string[]) => {
    setField("businessFields", next);
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

  const onBusinessLicenseChange = (file: File | null, error: string) => {
    setBusinessLicense(file);
    setErrors((prev) => ({ ...prev, businessLicense: error }));
  };

  const onCompanyLogoChange = (file: File | null, error: string) => {
    setCompanyLogo(file);
    setErrors((prev) => ({ ...prev, companyLogo: error }));
  };

  const validate = () => {
    const { errors: nextErrors, isValid } = validateEnterpriseRegisterForm({
      form,
      businessLicense,
      companyLogo
    });
    setErrors(nextErrors);
    return isValid;
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
        <EnterpriseInfoSection
          form={form}
          errors={errors}
          businessFieldOptions={(facultyOptions.length ? facultyOptions : Array.from(DOANHNGHIEP_BUSINESS_FIELD_OPTIONS)) as string[]}
          provinces={provinces}
          wards={wards}
          addressLoading={addressLoading}
          addressError={addressError}
          addrBusy={addrBusy}
          isSubmitting={isSubmitting}
          onChangeText={onChangeText}
          onBusinessFieldsChange={onBusinessFieldsChange}
          onProvinceChange={onProvinceChange}
          onWardChange={onWardChange}
          onBusinessLicenseChange={onBusinessLicenseChange}
          onCompanyLogoChange={onCompanyLogoChange}
        />
        <RepresentativeSection
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onChangeText={onChangeText}
        />
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
