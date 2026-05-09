export type Gender = "MALE" | "FEMALE" | "OTHER";
export type Degree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";

export type SupervisorListItem = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  faculty: string;
  degree: Degree;
  birthDate: string | null;
  gender: Gender;
  permanentProvinceCode: string;
  permanentWardCode: string;
  permanentProvinceName: string | null;
  permanentWardName: string | null;
};

export type Province = { code: number; name: string };
export type Ward = { code: number; name: string };

export type SupervisorFormState = {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: Gender | "";
  permanentProvinceCode: string;
  permanentWardCode: string;
  faculty: string;
  facultyCustom: string;
  degree: Degree | "";
};

