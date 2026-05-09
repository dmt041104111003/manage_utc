export type AppStatus = "PENDING_REVIEW" | "INTERVIEW_INVITED" | "OFFERED" | "REJECTED" | "STUDENT_DECLINED";
export type ResponseStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type WorkType = "PART_TIME" | "FULL_TIME";

export type SinhVienQuanLyDangKyUngTuyenRow = {
  id: string;
  status: AppStatus;
  response: ResponseStatus;
  appliedAt: string | null;
  interviewAt: string | null;
  interviewLocation: string | null;
  responseDeadline: string | null;
  responseAt: string | null;
  job: {
    id: string;
    title: string;
    expertise: string;
    workType: WorkType;
    deadlineAt: string | null;
    companyName: string;
  };
};

export type StatusFilter = "all" | AppStatus;

export type RespondAction =
  | "CONFIRM_INTERVIEW"
  | "DECLINE_INTERVIEW"
  | "CONFIRM_INTERNSHIP"
  | "DECLINE_INTERNSHIP";

