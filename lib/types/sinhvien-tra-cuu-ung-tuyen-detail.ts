export type WorkType = "PART_TIME" | "FULL_TIME";

export type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

export type SinhVienTraCuuUngTuyenJobDetail = {
  id: string;
  title: string;
  salary: string;
  expertise: string;
  experienceRequirement: string;
  recruitmentCount: number;
  workType: WorkType;
  deadlineAt: string | null;
  jobDescription: string;
  candidateRequirements: string;
  benefits: string;
  workLocation: string;
  workTime: string;
  applicationMethod: string | null;
  enterprise: {
    companyName: string;
    taxCode: string;
    businessFields: string;
    headquartersAddress: string;
    intro: string | null;
    website: string | null;
  };
  canApply: boolean;
  hasApplied: boolean;
  internshipStatus: InternshipStatus;
};

export type SinhVienApplyProfile = {
  fullName: string;
  phone: string | null;
  email: string | null;
  intro: string | null;
  cvFileName: string | null;
  cvMime: string | null;
  cvBase64: string | null;
};

export type SinhVienApplyDraft = {
  phone: string;
  email: string;
  intro: string;
  cvFileName: string | null;
  cvMime: string | null;
  cvBase64: string | null;
  removeCv: boolean;
};

