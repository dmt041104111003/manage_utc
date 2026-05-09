import type { LecturerDashboardOverviewResponse } from "@/lib/types/giangvien-dashboard";
import {
  GIANGVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  GIANGVIEN_DASHBOARD_OVERVIEW_ENDPOINT
} from "@/lib/constants/giangvien-dashboard";

export function getLecturerDashboardErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || GIANGVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE;
  return GIANGVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE;
}

export async function fetchLecturerDashboardOverview(): Promise<LecturerDashboardOverviewResponse> {
  const res = await fetch(GIANGVIEN_DASHBOARD_OVERVIEW_ENDPOINT);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LecturerDashboardOverviewResponse;
}

