export type Degree = "BACHELOR" | "ENGINEER";

export type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

export type ReportReviewStatus = "PENDING" | "REJECTED" | "APPROVED";

export type ListRow = {
  id: string;
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: Degree;
  internshipStatus: InternshipStatus;
  reportReviewStatus: ReportReviewStatus | null;
  statusLabel: string;
  canFinalUpdate: boolean;
};

export type Detail = {
  student: {
    id: string;
    msv: string;
    fullName: string;
    className: string;
    faculty: string;
    cohort: string;
    degree: Degree;
    phone: string | null;
    email: string;
  };
  supervisor:
    | null
    | {
        fullName: string;
        degree: string | null;
        phone: string | null;
        email: string;
      };
  enterprise: null | { companyName: string; position: string };
  internshipStatus: InternshipStatus;
  statusLabel: string;
  report:
    | null
    | {
        id: string;
        reviewStatus: ReportReviewStatus;
        reportFileName: string;
        reportUrl: string;
        supervisorEvaluation: string | null;
        supervisorPoint: number | null;
        enterpriseEvaluation: string | null;
        enterprisePoint: number | null;
        supervisorRejectReason: string | null;
        submittedAt: string | null;
        reviewedAt: string | null;
      };
  history: Array<{
    fromStatus: InternshipStatus;
    toStatus: InternshipStatus;
    at: string | null;
    byRole: string;
    message: string | null;
  }>;
  ui: { canFinalUpdate: boolean };
};

