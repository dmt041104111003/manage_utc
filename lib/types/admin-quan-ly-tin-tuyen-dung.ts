export type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";
export type WorkType = "PART_TIME" | "FULL_TIME";

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  item?: T;
  items?: T[];
  errors?: Record<string, string>;
};

export type InternshipBatchRow = {
  id: string;
  name: string;
  semester: string;
  schoolYear: string;
};

export type JobListItem = {
  id: string;
  title: string;
  createdAt: string | null;
  recruitmentCount: number;
  expertise: string;
  workType: WorkType;
  status: JobStatus;
  deadlineAt: string | null;
  enterpriseName: string | null;
  batchName: string | null;
  enterpriseTaxCode: string | null;
  rejectionReason: string | null;
};

export type JobDetailResponse = {
  job: {
    id: string;
    title: string;
    createdAt: string | null;
    recruitmentCount: number;
    expertise: string;
    workType: WorkType;
    status: JobStatus;
    deadlineAt: string | null;
    salary: string;
    experienceRequirement: string;
    jobDescription: string;
    candidateRequirements: string;
    benefits: string;
    workLocation: string;
    workTime: string;
    applicationMethod: string | null;
    companyIntro: string | null;
    companyWebsite: string | null;
    rejectionReason: string | null;
  };
  enterprise: {
    companyName: string | null;
    taxCode: string | null;
    businessFields: string;
    headquartersAddress: string;
  };
  batch: { id: string | null; name: string | null };
};

export type StatusAction = "approve" | "reject" | "stop";

