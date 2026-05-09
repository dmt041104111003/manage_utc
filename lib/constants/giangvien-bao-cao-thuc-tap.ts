import type { Degree } from "@/lib/types/giangvien-bao-cao-thuc-tap";

export const degreeLabel: Record<Degree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };

export const pointPattern = /^\d+(\.\d+)?$/;
export const noSpecialPattern = /^[\p{L}\d\s]*$/u;

export const GIANGVIEN_BAO_CAO_VALIDATE_NO_REPORT = "Không có file BCTT để duyệt.";
export const GIANGVIEN_BAO_CAO_VALIDATE_EVALUATION_SPECIAL = "Đánh giá không được chứa ký tự đặc biệt.";

export const GIANGVIEN_BAO_CAO_VALIDATE_DQT_REQUIRED = "Bắt buộc nhập điểm ĐQT.";
export const GIANGVIEN_BAO_CAO_VALIDATE_DQT_INVALID = "Điểm ĐQT không hợp lệ.";
export const GIANGVIEN_BAO_CAO_VALIDATE_DQT_RANGE = "Điểm ĐQT phải nằm trong khoảng 1-10.";

export const GIANGVIEN_BAO_CAO_VALIDATE_KTHP_REQUIRED = "Bắt buộc nhập điểm KTHP.";
export const GIANGVIEN_BAO_CAO_VALIDATE_KTHP_INVALID = "Điểm KTHP không hợp lệ.";
export const GIANGVIEN_BAO_CAO_VALIDATE_KTHP_RANGE = "Điểm KTHP phải nằm trong khoảng 1-10.";

