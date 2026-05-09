type Degree = "BACHELOR" | "ENGINEER";
type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

/** Query params giống GET /api/admin/students (q, faculty, status, degree). */
export function buildAdminStudentListWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const q = searchParams.get("q")?.trim() || "";
  const faculty = searchParams.get("faculty")?.trim() || "all";
  const status = (searchParams.get("status")?.trim() || "all") as InternshipStatus | "all";
  const degree = (searchParams.get("degree")?.trim() || "all") as Degree | "all";

  const where: Record<string, unknown> = {};
  const andParts: Record<string, unknown>[] = [];

  if (faculty && faculty !== "all") andParts.push({ faculty });
  if (status && status !== "all") andParts.push({ internshipStatus: status });
  if (degree && degree !== "all") andParts.push({ degree });

  if (q) {
    const isNumeric = /^\d+$/.test(q);
    const isEmailLike = q.includes("@") || q.includes(".");
    andParts.push({
      OR: [
        { msv: { startsWith: q } },
        ...(q.length >= 2 ? [{ user: { fullName: { contains: q, mode: "insensitive" as const } } }] : []),
        ...(isNumeric ? [{ user: { phone: { startsWith: q } } }] : []),
        ...(isEmailLike ? [{ user: { email: { startsWith: q, mode: "insensitive" as const } } }] : [])
      ]
    });
  }

  if (andParts.length) where.AND = andParts;
  return where;
}
