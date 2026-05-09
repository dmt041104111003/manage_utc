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

export function buildSinhVienTraCuuUngTuyenListUrl(args: { q: string; workType: WorkTypeFilter; field: string }): string {
  const sp = new URLSearchParams();
  if (args.q.trim()) sp.set("q", args.q.trim());
  if (args.workType !== "all") sp.set("workType", args.workType);
  if (args.field !== "all") sp.set("field", args.field);
  const qs = sp.toString();
  return qs ? `${SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT}?${qs}` : SINHVIEN_TRA_CUU_UNG_TUYEN_ENDPOINT;
}

export function extractFieldOptions(items: SinhVienTraCuuUngTuyenItem[]): string[] {
  const setFields = new Set<string>();
  items.forEach((x) => {
    String(x.businessField || "—")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach((v) => setFields.add(v));
  });
  return Array.from(setFields.values());
}

export async function fetchSinhVienTraCuuUngTuyenList(args: { q: string; workType: WorkTypeFilter; field: string }): Promise<{
  items: SinhVienTraCuuUngTuyenItem[];
  canApply: boolean;
  internshipStatus: InternshipStatus;
  fieldOptions: string[];
}> {
  const res = await fetch(buildSinhVienTraCuuUngTuyenListUrl(args));
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_ERROR_DEFAULT);
  }

  const nextItems: SinhVienTraCuuUngTuyenItem[] = Array.isArray(data.items) ? data.items : [];
  const internshipStatus = parseInternshipStatus(data.internshipStatus ?? "NOT_STARTED");

  return {
    items: nextItems,
    canApply: Boolean(data.canApply),
    internshipStatus,
    fieldOptions: extractFieldOptions(nextItems)
  };
}

