import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import type { EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";
import {
  ENTERPRISE_ACCOUNT_ERROR_EMAIL,
  ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_NAME,
  ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_TITLE,
  ENTERPRISE_ACCOUNT_ERROR_WEBSITE
} from "@/lib/constants/doanhnghiep-tai-khoan";
import { PHONE_ERROR, PHONE_PATTERN } from "@/lib/constants/sinhvien-ho-so";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import {
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

  return {
    email: (item.email || "").trim(),
    phone: (item.phone || "").trim(),
    representativeName,
    representativeTitle,
    companyIntro,
    website
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
} {
  return {
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    representativeName: form.representativeName.trim(),
    representativeTitle: form.representativeTitle.trim(),
    companyIntro: form.companyIntro.trim() ? form.companyIntro.trim() : null,
    website: form.website.trim() ? form.website.trim() : null
  };
}

