export type Degree = "BACHELOR" | "ENGINEER";
export type GuidanceStatus = "GUIDING" | "COMPLETED";
export type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

export type InternshipHistoryEvent = {
  fromStatus: InternshipStatus;
  toStatus: InternshipStatus;
  at: string | null;
};

export type GuidanceHistoryEvent = {
  fromStatus: GuidanceStatus;
  toStatus: GuidanceStatus;
  at: string | null;
};

export type Row = {
  id: string;
  stt: number;
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: Degree;
  guidanceStatus: GuidanceStatus;
  guidanceStatusLabel: string;
  phone: string | null;
  email: string;
  birthDate: string | null;
  gender: string;
  permanentAddress: string;
  internshipStatusHistory: InternshipHistoryEvent[];
  guidanceStatusHistory: GuidanceHistoryEvent[];
};

export type BatchOption = { id: string; name: string };

