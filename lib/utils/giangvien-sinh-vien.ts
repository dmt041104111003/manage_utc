import type { GuidanceStatus, InternshipStatus } from "@/lib/types/giangvien-sinh-vien";
import {
  GIANGVIEN_SINH_VIEN_ENDPOINT,
  GIANGVIEN_SINH_VIEN_LOAD_ERROR_DEFAULT
} from "@/lib/constants/giangvien-sinh-vien";
import type { BatchOption } from "@/lib/types/giangvien-sinh-vien";
import type { Degree } from "@/lib/types/giangvien-sinh-vien";
import type { Row } from "@/lib/types/giangvien-sinh-vien";

export function formatDateVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function buildGiangVienSinhVienQueryParams(args: {
  q: string;
  batchId: string;
  guidanceStatus: "all" | GuidanceStatus;
}): URLSearchParams {
  const sp = new URLSearchParams();
  if (args.q.trim()) sp.set("q", args.q.trim());
  if (args.batchId) sp.set("batchId", args.batchId);
  if (args.guidanceStatus !== "all") sp.set("status", args.guidanceStatus);
  return sp;
}

export function getGiangVienSinhVienLoadErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || GIANGVIEN_SINH_VIEN_LOAD_ERROR_DEFAULT;
  return GIANGVIEN_SINH_VIEN_LOAD_ERROR_DEFAULT;
}

