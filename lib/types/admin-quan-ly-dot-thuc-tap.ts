export type InternshipBatchStatus = "OPEN" | "CLOSED";

export type Semester = "HK_I" | "HK_II" | "HK_HE" | "HK_PHU";

export type InternshipBatchRow = {
  id: string;
  name: string;
  semester: Semester;
  schoolYear: string;
  startDate: string | null;
  endDate: string | null;
  status: InternshipBatchStatus;
  notes: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  item?: T;
  items?: T[];
  errors?: Record<string, string>;
};

export type BatchFormState = {
  name: string;
  semester: Semester | "";
  schoolYear: string;
  startDate: string;
  endDate: string;
  notes: string;
};

