
export function resolveRepresentativeTitle(
  columnTitle: string | null | undefined,
  enterpriseMeta: unknown
): string {
  if (typeof columnTitle === "string" && columnTitle.trim()) return columnTitle.trim();
  if (!enterpriseMeta || typeof enterpriseMeta !== "object" || Array.isArray(enterpriseMeta)) return "—";
  const t = (enterpriseMeta as Record<string, unknown>).representativeTitle;
  if (typeof t === "string" && t.trim()) return t.trim();
  return "—";
}
