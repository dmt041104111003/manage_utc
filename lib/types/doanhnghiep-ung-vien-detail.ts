export type WorkType = "PART_TIME" | "FULL_TIME";
export type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

export type JobApplicationStatus =
  | "PENDING_REVIEW"
  | "INTERVIEW_INVITED"
  | "OFFERED"
  | "REJECTED"
  | "STUDENT_DECLINED";

export type JobApplicationResponse = "PENDING" | "ACCEPTED" | "DECLINED";

export type StudentDegree = "BACHELOR" | "ENGINEER";

export type Applicant = {
  id: string;
  appliedAt: string | null;
  status: JobApplicationStatus;
  coverLetter: string | null;
  cvPublicId: string | null;
  cvFileName: string | null;
  cvMime: string | null;
  interviewAt: string | null;
  interviewLocation: string | null;
  responseDeadline: string | null;
  response: JobApplicationResponse;
  responseAt: string | null;
  history: any;
  internshipStatus: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    degree: StudentDegree | null;
    currentAddress: string;
  };
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

/** Next statuses DN can pick, given the current state */
export function getAvailableNextStatuses(
  status: JobApplicationStatus,
  response: JobApplicationResponse
): JobApplicationStatus[] {
  // Once student declined or DN already rejected – no further action
  if (status === "STUDENT_DECLINED" || status === "REJECTED") return [];

  if (status === "PENDING_REVIEW") {
    return ["INTERVIEW_INVITED", "OFFERED", "REJECTED"];
  }

  if (status === "INTERVIEW_INVITED") {
    // Wait for student response
    if (response === "PENDING") return [];
    // Student confirmed → can offer or reject
    if (response === "ACCEPTED") return ["OFFERED", "REJECTED"];
    // Student declined → done
    return [];
  }

  if (status === "OFFERED") {
    // Waiting or student already responded → done
    return [];
  }

  return [];
}
