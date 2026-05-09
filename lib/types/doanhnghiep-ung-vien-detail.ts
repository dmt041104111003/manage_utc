export type WorkType = "PART_TIME" | "FULL_TIME";
export type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

export type JobApplicationStatus =
  | "PENDING_REVIEW"
  | "INTERVIEW_INVITED"
  | "OFFERED"
  | "REJECTED"
  | "STUDENT_DECLINED";

export type JobApplicationResponse = "PENDING" | "ACCEPTED" | "DECLINED";

export type Applicant = {
  id: string;
  appliedAt: string | null;
  status: JobApplicationStatus;
  coverLetter: string | null;
  cvUrl: string | null;
  interviewAt: string | null;
  response: JobApplicationResponse;
  responseAt: string | null;
  history: any;
  student: { id: string; fullName: string; email: string; phone: string | null };
};

export type JobDetail = {
  id: string;
  title: string;
  salary: string;
  expertise: string;
  experienceRequirement: string;
  workType: WorkType;
  jobDescription: string;
  candidateRequirements: string;
  workLocation: string;
  workTime: string;
  benefits: string;
  applicationMethod: string | null;
  createdAt: string | null;
  deadlineAt: string | null;
  recruitmentCount: number;
  status: JobStatus;
};

