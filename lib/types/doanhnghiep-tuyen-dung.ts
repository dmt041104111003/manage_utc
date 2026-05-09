export type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";
export type WorkType = "PART_TIME" | "FULL_TIME";

export type JobListItem = {
  id: string;
  title: string;
  createdAt: string | null;
  recruitmentCount: number;
  expertise: string;
  workType: WorkType;
  status: JobStatus;
  deadlineAt: string | null;
};

export type JobDetailResponse = {
  job: any;
  enterprise: {
    companyName: string | null;
    taxCode: string | null;
    businessFields: string;
    headquartersAddress: string;
    intro: string | null;
    website: string | null;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  item?: T;
  items?: any;
  hasOpenBatch?: boolean;
  batchId?: string | null;
  errors?: Record<string, string>;
};

export type JobFormState = {
  title: string;
  companyIntro: string;
  companyWebsite: string;
  salary: string;
  expertise: string;
  allowedFaculties: string[];
  experienceRequirement: string;
  recruitmentCount: string;
  workType: WorkType | "";
  deadlineAt: string; // yyyy-mm-dd
  jobDescription: string;
  candidateRequirements: string;
  benefits: string;
  workLocation: string;
  workTime: string;
  applicationMethod: string;
};

