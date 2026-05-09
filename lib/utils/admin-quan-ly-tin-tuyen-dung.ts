import type { JobStatus, StatusAction } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";

export function formatDateVi(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function inferDefaultAction(status: JobStatus): StatusAction {
  if (status === "REJECTED") return "reject";
  if (status === "PENDING") return "approve";
  return "stop";
}

