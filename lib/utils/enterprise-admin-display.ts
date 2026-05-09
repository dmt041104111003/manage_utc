import { EnterpriseStatus } from "@prisma/client";

const STATUS_LABEL: Record<EnterpriseStatus, string> = {
  PENDING: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Từ chối"
};

/** DN cũ có thể có enterpriseStatus null — coi như chờ phê duyệt cho UI & nghiệp vụ. */
export function normalizeEnterpriseStatus(status: EnterpriseStatus | null | undefined): EnterpriseStatus {
  return status ?? EnterpriseStatus.PENDING;
}

export function formatEnterpriseStatusVi(status: EnterpriseStatus | null | undefined): string {
  const n = normalizeEnterpriseStatus(status);
  return STATUS_LABEL[n] ?? String(n);
}

export function buildEnterpriseHeadquartersAddress(meta: unknown): string {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "—";
  const m = meta as Record<string, unknown>;
  const parts = [m.addressDetail, m.ward, m.province].filter((x) => typeof x === "string" && String(x).trim());
  return parts.length ? parts.map(String).join(", ") : "—";
}

/** Lĩnh vực hoạt động dạng chuỗi hiển thị */
export function formatBusinessFields(meta: unknown): string {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "—";
  const fields = (meta as Record<string, unknown>).businessFields;
  if (!Array.isArray(fields) || !fields.length) return "—";
  return fields.map(String).join(", ");
}

export function dataUrlFromBase64(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}
