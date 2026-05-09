import type { InternshipStatus, SinhVienTraCuuUngTuyenItem, WorkType, WorkTypeFilter } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";
import { SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT, SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT } from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen";

export function formatDateVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function parseInternshipStatus(value: unknown): InternshipStatus {
  const v = String(value ?? "NOT_STARTED");
  const allowed: InternshipStatus[] = ["NOT_STARTED", "DOING", "SELF_FINANCED", "REPORT_SUBMITTED", "COMPLETED", "REJECTED"];
  return (allowed as string[]).includes(v) ? (v as InternshipStatus) : "NOT_STARTED";
}

export function buildSinhVienTraCuuUngTuyenListUrl(args: { q: string; workType: WorkTypeFilter; province: string }): string {
  const sp = new URLSearchParams();
  if (args.q.trim()) sp.set("q", args.q.trim());
  if (args.workType !== "all") sp.set("workType", args.workType);
  if (args.province !== "all") sp.set("province", args.province);
  const qs = sp.toString();
  return qs ? `${SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT}?${qs}` : SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT;
}

export async function fetchSinhVienTraCuuUngTuyenList(args: { q: string; workType: WorkTypeFilter; province: string }): Promise<{
  items: SinhVienTraCuuUngTuyenItem[];
  canApply: boolean;
  internshipStatus: InternshipStatus;
  provinceOptions: string[];
}> {
  const res = await fetch(buildSinhVienTraCuuUngTuyenListUrl(args));
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT);
  }

  const nextItems: SinhVienTraCuuUngTuyenItem[] = Array.isArray(data.items) ? data.items : [];
  const internshipStatus = parseInternshipStatus(data.internshipStatus ?? "NOT_STARTED");
  const provinceOptions: string[] = Array.isArray(data.provinceOptions) ? data.provinceOptions : [];

  return {
    items: nextItems,
    canApply: Boolean(data.canApply),
    internshipStatus,
    provinceOptions
  };
}

