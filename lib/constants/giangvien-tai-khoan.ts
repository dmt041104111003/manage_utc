import type { Degree, Gender } from "@/lib/types/giangvien-tai-khoan";

export const degreeLabel: Record<Degree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

export const genderLabel: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
};

export const PHONE_PATTERN = /^\d{8,12}$/;

export const DEGREE_ALLOWED = ["MASTER", "PHD", "ASSOC_PROF", "PROF"] as const;

export const GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE: Degree = "MASTER";

export const GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT =
  "Không thể tải tài khoản giảng viên.";
export const GIANGVIEN_TAI_KHOAN_NETWORK_ERROR_DEFAULT = "Cập nhật thất bại.";
export const GIANGVIEN_TAI_KHOAN_SUBMIT_SUCCESS_DEFAULT = "Cập nhật thành công.";

export const GIANGVIEN_TAI_KHOAN_ERROR_PHONE =
  "Số điện thoại chỉ gồm số (8–12 ký tự).";
export const GIANGVIEN_TAI_KHOAN_ERROR_DEGREE_REQUIRED = "Bậc bắt buộc.";
export const GIANGVIEN_TAI_KHOAN_ERROR_PROVINCE_INVALID = "Tỉnh/thành không hợp lệ.";
export const GIANGVIEN_TAI_KHOAN_ERROR_WARD_INVALID = "Phường/xã không hợp lệ.";

