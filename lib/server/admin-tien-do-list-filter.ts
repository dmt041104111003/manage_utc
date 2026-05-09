type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

function pushSearchQ(and: Record<string, unknown>[], q: string) {
  if (!q) return;
  const isNumeric = /^\d+$/.test(q);
  const isEmailLike = q.includes("@") || q.includes(".");
  and.push({
    OR: [
      { msv: { startsWith: q } },
      ...(q.length >= 2 ? [{ user: { fullName: { contains: q, mode: "insensitive" as const } } }] : []),
      ...(isNumeric ? [{ user: { phone: { startsWith: q } } }] : []),
      ...(isEmailLike ? [{ user: { email: { startsWith: q, mode: "insensitive" as const } } }] : [])
    ]
  });
}

/** Giống danh sách trang tiến độ (có lọc trạng thái, kể cả APPROVED_REPORT). */
export function buildAdminTienDoListWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const q = (searchParams.get("q") || "").trim();
  const faculty = (searchParams.get("faculty") || "all").trim();
  const status = (searchParams.get("status") || "all").trim();
  const degree = (searchParams.get("degree") || "all").trim();

  const and: Record<string, unknown>[] = [];
  if (faculty !== "all") and.push({ faculty });
  if (degree !== "all") and.push({ degree });

  if (status !== "all") {
    if (status === "APPROVED_REPORT") {
      and.push({ internshipStatus: "REPORT_SUBMITTED" });
      and.push({ internshipReport: { is: { reviewStatus: "APPROVED" } } });
    } else {
      and.push({ internshipStatus: status as InternshipStatus });
    }
  }

  pushSearchQ(and, q);

  const where: Record<string, unknown> = {};
  if (and.length) where.AND = and;
  return where;
}

/** Thống kê thẻ: chỉ khoa/bậc/từ khóa, không lọc trạng thái. */
export function buildAdminTienDoStatsWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const q = (searchParams.get("q") || "").trim();
  const faculty = (searchParams.get("faculty") || "all").trim();
  const degree = (searchParams.get("degree") || "all").trim();

  const and: Record<string, unknown>[] = [];
  if (faculty !== "all") and.push({ faculty });
  if (degree !== "all") and.push({ degree });
  pushSearchQ(and, q);

  const where: Record<string, unknown> = {};
  if (and.length) where.AND = and;
  return where;
}
