export type Degree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type Province = { code: number; name: string };
export type Ward = { code: number; name: string };

export type GiangVienMe = {
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  gender: Gender;
  faculty: string;
  degree: Degree;
  permanentProvinceCode: string;
  permanentProvinceName: string | null;
  permanentWardCode: string;
  permanentWardName: string | null;
};

export type GiangVienTaiKhoanDraft = {
  phone: string;
  degree: Degree;
  provinceCode: string;
  wardCode: string;
};

export type ValidateGiangVienTaiKhoanFormResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

