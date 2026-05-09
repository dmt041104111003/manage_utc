import type { Detail } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";
import { supervisorDegreeLabel } from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";

export function supervisorLine(d: Detail["supervisor"]) {
  if (!d) return "Chưa được phân công GVHD.";
  const deg = d.degree ? supervisorDegreeLabel[d.degree] ?? d.degree : "—";
  return `${d.fullName} - ${deg} - ${d.phone ?? "—"} - ${d.email ?? "—"}`;
}

