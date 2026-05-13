import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import type { EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";
import {
  ENTERPRISE_ACCOUNT_ERROR_EMAIL,
  ENTERPRISE_ACCOUNT_ERROR_ADDRESS,
  ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_NAME,
  ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_TITLE,
  ENTERPRISE_ACCOUNT_ERROR_PROVINCE,
  ENTERPRISE_ACCOUNT_ERROR_WARD,
  ENTERPRISE_ACCOUNT_ERROR_WEBSITE
} from "@/lib/constants/doanhnghiep-tai-khoan";
import { PHONE_ERROR, PHONE_PATTERN } from "@/lib/constants/sinhvien-ho-so";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import {
  DOANHNGHIEP_REGISTER_ADDRESS_PATTERN,
  DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN,
  DOANHNGHIEP_REGISTER_WEBSITE_PATTERN
} from "@/lib/constants/doanhnghiep";
import { metaRecord } from "@/lib/utils/enterprise-meta";

export function mapEnterpriseAccountFormFromMe(item: AdminEnterpriseDetail): EnterpriseAccountFormState {
  const m = metaRecord(item.enterpriseMeta);

  const representativeName =
    typeof m.representativeName === "string" && m.representativeName.trim()
      ? m.representativeName.trim()
      : item.fullName || "";

  const representativeTitle =
    typeof m.representativeTitle === "string" && m.representativeTitle.trim()
      ? m.representativeTitle.trim()
      : typeof item.representativeTitle === "string"
        ? item.representativeTitle
        : "";

  const companyIntro = typeof m.companyIntro === "string" ? m.companyIntro : typeof m.intro === "string" ? m.intro : "";

  const website = typeof m.website === "string" ? m.website.trim() : "";

  const provinceCode = typeof m.provinceCode === "string" ? m.provinceCode.trim() : "";
  const wardCode = typeof m.wardCode === "string" ? m.wardCode.trim() : "";
  const provinceName = typeof m.province === "string" ? m.province.trim() : "";
  const wardName = typeof m.ward === "string" ? m.ward.trim() : "";
  const addressDetail = typeof m.addressDetail === "string" ? m.addressDetail : "";

  return {
    email: (item.email || "").trim(),
    phone: (item.phone || "").trim(),
    representativeName,
    representativeTitle,
    companyIntro,
    website,
    provinceCode,
    wardCode,
    provinceName,
    wardName,
    addressDetail
  };
}

export function validateEnterpriseAccountForm(form: EnterpriseAccountFormState): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const next: Record<string, string> = {};

  const emailNorm = form.email.trim().toLowerCase();
  if (!emailNorm || !AUTH_EMAIL_REGISTER_PATTERN.test(emailNorm)) {
    next.email = ENTERPRISE_ACCOUNT_ERROR_EMAIL;
  }
  const phoneTrim = form.phone.trim();
  if (!phoneTrim || !PHONE_PATTERN.test(phoneTrim)) {
    next.phone = PHONE_ERROR;
  }

  if (!form.representativeName || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(form.representativeName)) {
    next.representativeName = ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_NAME;
  }
  if (!form.representativeTitle || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(form.representativeTitle)) {
    next.representativeTitle = ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_TITLE;
  }
  if (form.website && !DOANHNGHIEP_REGISTER_WEBSITE_PATTERN.test(form.website.trim())) {
    next.website = ENTERPRISE_ACCOUNT_ERROR_WEBSITE;
  }

  const provinceCode = form.provinceCode.trim();
  const wardCode = form.wardCode.trim();
  const provinceName = form.provinceName.trim();
  const wardName = form.wardName.trim();
  const addressDetail = form.addressDetail.trim();
  if (!provinceCode || !/^\d+$/.test(provinceCode) || !provinceName) {
    next.provinceCode = ENTERPRISE_ACCOUNT_ERROR_PROVINCE;
  }
  if (!wardCode || !/^\d+$/.test(wardCode) || !wardName) {
    next.wardCode = ENTERPRISE_ACCOUNT_ERROR_WARD;
  }
  if (!DOANHNGHIEP_REGISTER_ADDRESS_PATTERN.test(addressDetail)) {
    next.addressDetail = ENTERPRISE_ACCOUNT_ERROR_ADDRESS;
  }

  return {
    isValid: Object.keys(next).length === 0,
    errors: next
  };
}

export function buildEnterpriseAccountPatchPayload(form: EnterpriseAccountFormState): {
  email: string;
  phone: string;
  representativeName: string;
  representativeTitle: string;
  companyIntro: string | null;
  website: string | null;
  province: string;
  ward: string;
  provinceCode: string;
  wardCode: string;
  addressDetail: string;
} {
  return {
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    representativeName: form.representativeName.trim(),
    representativeTitle: form.representativeTitle.trim(),
    companyIntro: form.companyIntro.trim() ? form.companyIntro.trim() : null,
    website: form.website.trim() ? form.website.trim() : null,
    province: form.provinceName.trim(),
    ward: form.wardName.trim(),
    provinceCode: form.provinceCode.trim(),
    wardCode: form.wardCode.trim(),
    addressDetail: form.addressDetail.trim()
  };
}

