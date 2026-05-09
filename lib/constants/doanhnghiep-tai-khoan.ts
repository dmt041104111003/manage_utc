import type { EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";

export const ENTERPRISE_ACCOUNT_ME_ENDPOINT = "/api/doanhnghiep/me";

export const ENTERPRISE_ACCOUNT_EMPTY_FORM: EnterpriseAccountFormState = {
  representativeName: "",
  representativeTitle: "",
  companyIntro: "",
  website: ""
};

export const ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_NAME =
  "Họ và tên chỉ gồm ký tự chữ, dài 1-255.";
export const ENTERPRISE_ACCOUNT_ERROR_REPRESENTATIVE_TITLE =
  "Chức vụ chỉ gồm ký tự chữ, dài 1-255.";
export const ENTERPRISE_ACCOUNT_ERROR_WEBSITE = "Website không đúng định dạng.";

export const ENTERPRISE_ACCOUNT_LOAD_ERROR_DEFAULT = "Lỗi tải thông tin.";
export const ENTERPRISE_ACCOUNT_NOT_FOUND_ERROR_DEFAULT = "Không tìm thấy tài khoản.";
export const ENTERPRISE_ACCOUNT_SUBMIT_SUCCESS_DEFAULT = "Cập nhật thành công.";
export const ENTERPRISE_ACCOUNT_SUBMIT_ERROR_DEFAULT = "Cập nhật thất bại.";

