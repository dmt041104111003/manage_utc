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

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const faculty = (searchParams.get("faculty") || "all").trim();
    const status = (searchParams.get("status") || "all").trim() as StatusFilter | "all";
    const degree = (searchParams.get("degree") || "all").trim() as Degree | "all";

    const prismaAny = prisma as any;

    // where for list (includes status filter)
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

    // where for stats (exclude status filter so cards always show all statuses)
    const whereStats: any = {};
    const andStats: any[] = [];
    if (faculty !== "all") andStats.push({ faculty });
    if (degree !== "all") andStats.push({ degree });
    if (q) {
      andStats.push({
        OR: [
          { msv: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } }
        ]
      });
    }
    if (andStats.length) whereStats.AND = andStats;

    const [rows, faculties, total, notStarted, doing, selfFinanced, approvedReport, completed] = await Promise.all([
      prismaAny.studentProfile.findMany({
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
      }),
      prismaAny.studentProfile
        .findMany({
          distinct: ["faculty"],
          select: { faculty: true },
          orderBy: { faculty: "asc" }
        })
        .then((xs: any[]) => xs.map((x) => x.faculty).filter(Boolean)),
      prismaAny.studentProfile.count({ where: whereStats }),
      prismaAny.studentProfile.count({ where: { ...whereStats, internshipStatus: "NOT_STARTED" } }),
      prismaAny.studentProfile.count({ where: { ...whereStats, internshipStatus: "DOING" } }),
      prismaAny.studentProfile.count({ where: { ...whereStats, internshipStatus: "SELF_FINANCED" } }),
      prismaAny.studentProfile.count({
        where: {
          ...whereStats,
          internshipStatus: "REPORT_SUBMITTED",
          internshipReport: { is: { reviewStatus: "APPROVED" } }
        }
      }),
      prismaAny.studentProfile.count({ where: { ...whereStats, internshipStatus: "COMPLETED" } })
    ]);

    const notCompletedInternship = Math.max(0, (total ?? 0) - (completed ?? 0));

    return NextResponse.json({
      success: true,
      progressStats: {
        notStarted: notStarted ?? 0,
        doing: doing ?? 0,
        selfFinanced: selfFinanced ?? 0,
        approvedReport: approvedReport ?? 0,
        completed: completed ?? 0,
        notCompletedInternship
      },
      items: rows.map((r: any) => {
        const internshipStatus = r.internshipStatus as InternshipStatus;
        const reportReviewStatus = r.internshipReport?.reviewStatus ?? null;
        const canFinalUpdate = internshipStatus !== "COMPLETED" && internshipStatus !== "REJECTED";
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
  } catch (e) {
    console.error("[GET /api/admin/tien-do-thuc-tap]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}

