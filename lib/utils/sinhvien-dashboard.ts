import type { StudentDashboardOverviewResponse } from "@/lib/types/sinhvien-dashboard";
import {
  SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  SINHVIEN_DASHBOARD_OVERVIEW_ENDPOINT
} from "@/lib/constants/sinhvien-dashboard";

export function getStudentDashboardErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE;
  return SINHVIEN_DASHBOARD_DEFAULT_ERROR_MESSAGE;
}

export async function fetchStudentDashboardOverview(): Promise<StudentDashboardOverviewResponse> {
  const res = await fetch(SINHVIEN_DASHBOARD_OVERVIEW_ENDPOINT);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as StudentDashboardOverviewResponse;
}

