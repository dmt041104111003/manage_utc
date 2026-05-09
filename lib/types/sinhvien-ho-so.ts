import type { Gender, StudentDegree, SupervisorDegree } from "./sinhvien-ho-so-shared";
export type { Gender as StudentGender, StudentDegree, SupervisorDegree } from "./sinhvien-ho-so-shared";

export type StudentAccount = {
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: StudentDegree;
  phone: string | null;
  email: string;
  birthDate: string | null;
  gender: Gender;
  address: string | null;
};

export type SupervisorInfo = {
  fullName: string;
  phone: string | null;
  email: string;
  gender: Gender | null;
  degree: SupervisorDegree | null;
} | null;

export type Province = { code: number; name: string };
export type Ward = { code: number; name: string };

export type SinhVienHoSoProfile = {
  currentProvinceCode?: string | null;
  currentProvinceName?: string | null;
  currentWardCode?: string | null;
  currentWardName?: string | null;
  phone?: string | null;
  email?: string | null;
  intro?: string | null;
  cvFileName?: string | null;
  cvMime?: string | null;
  hasCv?: boolean;
};

export type SinhVienHoSoDraft = {
  phone: string;
  email: string;
  currentProvinceCode: string;
  currentWardCode: string;
  intro: string;
  cvFileName: string | null;
  cvMime: string | null;
  cvFile: File | null;
};

