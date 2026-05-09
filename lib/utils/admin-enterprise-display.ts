import { EnterpriseStatus } from "@prisma/client";
import type { AdminEnterpriseListItem } from "@/lib/types/admin";
import { formatEnterpriseStatusVi, normalizeEnterpriseStatus } from "@/lib/utils/enterprise-admin-display";

export function companyTaxLabel(row: Pick<AdminEnterpriseListItem, "companyName" | "taxCode">): string {
  const name = row.companyName || "—";
  const tax = row.taxCode || "—";
  return `${name}-${tax}`;
}

/** Dòng trạng thái trong bảng / modal (có hậu tố khi đã phê duyệt). */
export function formatAdminEnterpriseStatusLine(status: EnterpriseStatus | null | undefined): string {
  const st = normalizeEnterpriseStatus(status);
  if (st === EnterpriseStatus.APPROVED) {
    return `${formatEnterpriseStatusVi(st)} — Đang hoạt động`;
  }
  return formatEnterpriseStatusVi(st);
}

export function formatAdminEnterpriseStatusWithLock(args: {
  enterpriseStatus: EnterpriseStatus | null | undefined;
  isLocked: boolean | null | undefined;
}): string {
  const st = normalizeEnterpriseStatus(args.enterpriseStatus);
  if (st !== EnterpriseStatus.APPROVED) return formatEnterpriseStatusVi(st);
  return `${formatEnterpriseStatusVi(st)} — ${args.isLocked ? "Dừng hoạt động" : "Đang hoạt động"}`;
}
