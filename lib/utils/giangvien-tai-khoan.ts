import type { Degree, GiangVienMe, GiangVienTaiKhoanDraft, ValidateGiangVienTaiKhoanFormResult } from "@/lib/types/giangvien-tai-khoan";
import {
  PHONE_PATTERN,
  GIANGVIEN_TAI_KHOAN_ERROR_DEGREE_REQUIRED,
  GIANGVIEN_TAI_KHOAN_ERROR_PHONE,
  GIANGVIEN_TAI_KHOAN_ERROR_PROVINCE_INVALID,
  GIANGVIEN_TAI_KHOAN_ERROR_WARD_INVALID,
  GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE
} from "@/lib/constants/giangvien-tai-khoan";

export function buildGiangVienTaiKhoanDraftFromMe(me: GiangVienMe): GiangVienTaiKhoanDraft {
  return {
    phone: me.phone ?? "",
    degree: me.degree,
    provinceCode: me.permanentProvinceCode ?? "",
    wardCode: me.permanentWardCode ?? ""
  };
}

export function validateGiangVienTaiKhoanForm(args: {
  phone: string;
  degree: Degree;
  provinceCode: string;
  wardCode: string;
}): ValidateGiangVienTaiKhoanFormResult {
  const { phone, degree, provinceCode, wardCode } = args;
  const next: Record<string, string> = {};

  if (!PHONE_PATTERN.test(phone.trim())) next.phone = GIANGVIEN_TAI_KHOAN_ERROR_PHONE;
  if (!degree) next.degree = GIANGVIEN_TAI_KHOAN_ERROR_DEGREE_REQUIRED;
  if (!provinceCode || !/^\d+$/.test(provinceCode)) next.permanentProvinceCode = GIANGVIEN_TAI_KHOAN_ERROR_PROVINCE_INVALID;
  if (!wardCode || !/^\d+$/.test(wardCode)) next.permanentWardCode = GIANGVIEN_TAI_KHOAN_ERROR_WARD_INVALID;

  return {
    isValid: Object.keys(next).length === 0,
    errors: next
  };
}

export function buildGiangVienTaiKhoanPatchPayload(args: GiangVienTaiKhoanDraft): {
  phone: string;
  degree: Degree;
  permanentProvinceCode: string;
  permanentWardCode: string;
} {
  return {
    phone: args.phone.trim(),
    degree: args.degree,
    permanentProvinceCode: args.provinceCode,
    permanentWardCode: args.wardCode
  };
}

export function normalizeGiangVienTaiKhoanDraft(args: {
  phone: string;
  degree?: Degree;
  provinceCode: string;
  wardCode: string;
}): GiangVienTaiKhoanDraft {
  return {
    phone: args.phone,
    degree: args.degree || GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE,
    provinceCode: args.provinceCode,
    wardCode: args.wardCode
  };
}

export function formatDateVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

