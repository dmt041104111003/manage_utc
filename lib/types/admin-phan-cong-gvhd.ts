export type AssignmentStatus = "GUIDING" | "COMPLETED";

export type StudentDegree = "BACHELOR" | "ENGINEER";

export type SupervisorDegree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";

export type OpenBatch = {
  id: string;
  name: string;
  semester: string;
  schoolYear: string;
};

export type AssignmentItem = {
  id: string;
  supervisorAssignmentId: string;
  faculty: string;
  status: AssignmentStatus;
  batch: {
    id: string | null;
    name: string | null;
    semester: string | null;
    schoolYear: string | null;
    status: string | null;
  };
  supervisor: { id: string | null; fullName: string; degree: SupervisorDegree | null };
  student: { id: string | null; msv: string; fullName: string; degree: StudentDegree | null };
  students?: { id: string | null; msv: string; fullName: string; degree: StudentDegree | null }[];
};

export type SupervisorOption = { id: string; fullName: string; degree: SupervisorDegree; faculty: string };
export type StudentOption = { id: string; msv: string; fullName: string; degree: StudentDegree };

