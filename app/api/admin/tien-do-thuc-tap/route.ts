import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type Degree = "BACHELOR" | "ENGINEER";
type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

type StatusFilter = InternshipStatus | "APPROVED_REPORT";

const degreeLabel: Record<Degree, string> = {
  BACHELOR: "Cử nhân",
  ENGINEER: "Kỹ sư"
};

function getStatusLabel(status: InternshipStatus, reportReviewStatus: string | null) {
  if (status === "REPORT_SUBMITTED") {
    if (reportReviewStatus === "APPROVED") return "Đã duyệt BCTT";
    if (reportReviewStatus === "REJECTED") return "BCTT bị GVHD từ chối";
    return "Chờ GVHD duyệt";
  }
  if (status === "REJECTED") return "Từ chối";
  if (status === "COMPLETED") return "Hoàn thành thực tập";
  if (status === "DOING") return "Đang thực tập";
  if (status === "SELF_FINANCED") return "Thực tập tự túc";
  return "Chưa thực tập";
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const faculty = (searchParams.get("faculty") || "all").trim();
  const status = (searchParams.get("status") || "all").trim() as StatusFilter | "all";
  const degree = (searchParams.get("degree") || "all").trim() as Degree | "all";

  const prismaAny = prisma as any;

  const where: any = {};
  const and: any[] = [];

  if (faculty !== "all") and.push({ faculty });
  if (degree !== "all") and.push({ degree });

  if (status !== "all") {
    if (status === "APPROVED_REPORT") {
      and.push({ internshipStatus: "REPORT_SUBMITTED" });
      and.push({ internshipReport: { is: { reviewStatus: "APPROVED" } } });
    } else {
      and.push({ internshipStatus: status });
    }
  }

  if (q) {
    and.push({
      OR: [
        { msv: { contains: q, mode: "insensitive" } },
        { user: { fullName: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } }
      ]
    });
  }

  if (and.length) where.AND = and;

  const rows = await prismaAny.studentProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      msv: true,
      className: true,
      faculty: true,
      cohort: true,
      degree: true,
      internshipStatus: true,
      user: { select: { fullName: true, phone: true, email: true } },
      internshipReport: { select: { reviewStatus: true } }
    }
  });

  const faculties = await prismaAny.studentProfile.findMany({
    distinct: ["faculty"],
    select: { faculty: true },
    orderBy: { faculty: "asc" }
  }).then((xs: any[]) => xs.map((x) => x.faculty).filter(Boolean));

  return NextResponse.json({
    success: true,
    items: rows.map((r: any) => {
      const internshipStatus = r.internshipStatus as InternshipStatus;
      const reportReviewStatus = r.internshipReport?.reviewStatus ?? null;
      const canFinalUpdate = internshipStatus === "REPORT_SUBMITTED" && reportReviewStatus === "APPROVED";
      return {
        id: r.id,
        msv: r.msv,
        fullName: r.user?.fullName ?? "",
        className: r.className,
        faculty: r.faculty,
        cohort: r.cohort,
        degree: r.degree as Degree,
        internshipStatus,
        reportReviewStatus,
        statusLabel: getStatusLabel(internshipStatus, reportReviewStatus),
        canFinalUpdate
      };
    }),
    faculties,
    degreeLabel
  });
}

