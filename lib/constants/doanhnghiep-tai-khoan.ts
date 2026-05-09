import type { EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";

export const ENTERPRISE_ACCOUNT_ME_ENDPOINT = "/api/doanhnghiep/me";

export const ENTERPRISE_ACCOUNT_EMPTY_FORM: EnterpriseAccountFormState = {
  email: "",
  phone: "",
  representativeName: "",
  representativeTitle: "",
  companyIntro: "",
  website: ""
};

export const ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_NAME =
  "Ho va ten chi gom ky tu chu, dai 1-255.";
export const ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_TITLE =
  "Chuc vu chi gom ky tu chu, dai 1-255.";
export const ENTERPRISE_ACCOUNT_ERROR_WEBSITE = "Website khong dung dinh dang.";
export const ENTERPRISE_ACCOUNT_ERROR_EMAIL = "Email khong dung dinh dang.";

export const ENTERPRISE_ACCOUNT_LOAD_ERROR_DEFAULT = "Loi tai thong tin.";
export const ENTERPRISE_ACCOUNT_NOT_FOUND_ERROR_DEFAULT = "Khong tim thay tai khoan.";
export const ENTERPRISE_ACCOUNT_SUBMIT_SUCCESS_DEFAULT = "Cap nhat thanh cong.";
export const ENTERPRISE_ACCOUNT_SUBMIT_ERROR_DEFAULT = "Cap nhat that bai.";

export const ENTERPRISE_ACCOUNT_EMAIL_TAKEN = "Email da duoc su dung boi tai khoan khac.";
export const ENTERPRISE_ACCOUNT_PHONE_TAKEN = "So dien thoai da duoc su dung boi tai khoan khac.";
export const ENTERPRISE_ACCOUNT_UNIQUE_CONSTRAINT =
  "Email hoac so dien thoai da ton tai. Vui long chon gia tri khac.";
