import type { EnterpriseDashboardOverviewResponse } from "@/lib/types/doanhnghiep-dashboard";
import {
  ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE,
  ENTERPRISE_DASHBOARD_OVERVIEW_ENDPOINT
} from "@/lib/constants/doanhnghiep-dashboard";

export function getEnterpriseDashboardErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE;
  return ENTERPRISE_DASHBOARD_DEFAULT_ERROR_MESSAGE;
}

export async function fetchEnterpriseDashboardOverview(): Promise<EnterpriseDashboardOverviewResponse> {
  const res = await fetch(ENTERPRISE_DASHBOARD_OVERVIEW_ENDPOINT);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as EnterpriseDashboardOverviewResponse;
}

