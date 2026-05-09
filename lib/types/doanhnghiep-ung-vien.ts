export type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

export type JobRow = {
  id: string;
  title: string;
  createdAt: string | null;
  deadlineAt: string | null;
  recruitmentCount: number;
  applicantCount: number;
  status: JobStatus;
};

