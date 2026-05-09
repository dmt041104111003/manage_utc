import type { EnterpriseStatus } from "@prisma/client";

export function buildAdminEnterprisesListQueryParams(q: string, status: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  return params;
}

export function parseAdminEnterprisesStatusQueryParam(st: string | null): EnterpriseStatus | null {
  if (!st) return null;
  if (st !== "PENDING" && st !== "APPROVED" && st !== "REJECTED") return null;
  return st as EnterpriseStatus;
}

