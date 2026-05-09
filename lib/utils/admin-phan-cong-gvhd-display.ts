import type { StudentDegree, SupervisorDegree } from "@/lib/types/admin-phan-cong-gvhd";
import {
  ADMIN_PHAN_CONG_GVHD_STUDENT_DEGREE_LABEL,
  ADMIN_PHAN_CONG_GVHD_SUPERVISOR_DEGREE_LABEL
} from "@/lib/constants/admin-phan-cong-gvhd";

export function studentDisplay(s: { msv: string; fullName: string; degree: StudentDegree | null }) {
  const d = s.degree ? ADMIN_PHAN_CONG_GVHD_STUDENT_DEGREE_LABEL[s.degree] : "";
  return `${s.msv}-${s.fullName}${d ? `-${d}` : ""}`;
}

export function supervisorDisplay(s: { fullName: string; degree: SupervisorDegree | null }) {
  const d = s.degree ? ADMIN_PHAN_CONG_GVHD_SUPERVISOR_DEGREE_LABEL[s.degree] : "";
  return `${d ? `${d}-` : ""}${s.fullName}`;
}

