export type Degree = "BACHELOR" | "ENGINEER";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

export type StudentListItem = {
  id: string; // StudentProfile.id
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: Degree;
  internshipStatus: InternshipStatus;
  phone: string | null;
  email: string;
  birthDate: string | null;
  gender: Gender;
  permanentProvinceCode: string;
  permanentWardCode: string;
  permanentProvinceName: string | null;
  permanentWardName: string | null;
  hasLinkedData: boolean;
};

export type Province = { code: number; name: string };
export type Ward = { code: number; name: string };

export type ViewStudent = Omit<StudentListItem, "hasLinkedData">;

export type StudentFormState = {
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  facultyCustom: string;
  cohort: string;
  degree: Degree | "";
  phone: string;
  email: string;
  birthDate: string; // yyyy-mm-dd
  gender: Gender | "";
  permanentProvinceCode: string;
  permanentWardCode: string;
};

