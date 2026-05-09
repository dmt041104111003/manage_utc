import type { FormDataState } from "@/lib/types/enterprise-register";

export const EMPTY_ENTERPRISE_REGISTER_FORM: FormDataState = {
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

export const ENTERPRISE_ADDRESS_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
export const ENTERPRISE_LETTER_ONLY_PATTERN = /^[\p{L}\s]{1,255}$/u;

export const ENTERPRISE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Basic URL format validator for UI
export const ENTERPRISE_WEBSITE_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w./?%&=-]*)?$/i;

