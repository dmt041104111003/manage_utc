import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { degreeLabel } from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";
import { buildAdminTienDoListWhere, buildAdminTienDoStatsWhere } from "@/lib/server/admin-tien-do-list-filter";
import { getAdminTienDoStatusLabel } from "@/lib/utils/admin-tien-do-status-label";

type Degree = "BACHELOR" | "ENGINEER";
type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const prismaAny = prisma as any;

    const where = buildAdminTienDoListWhere(searchParams) as any;
    const whereStats = buildAdminTienDoStatsWhere(searchParams) as any;

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
          statusLabel: getAdminTienDoStatusLabel(internshipStatus, reportReviewStatus),
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
