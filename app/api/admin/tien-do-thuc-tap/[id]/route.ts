import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";

type Degree = "BACHELOR" | "ENGINEER";
type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

type ReportReviewStatus = "PENDING" | "REJECTED" | "APPROVED";

function getStatusLabel(status: InternshipStatus, reportReviewStatus: ReportReviewStatus | null) {
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

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { id },
    select: {
      id: true,
      userId: true,
      msv: true,
      className: true,
      faculty: true,
      cohort: true,
      degree: true,
      internshipStatus: true,
      user: { select: { fullName: true, phone: true, email: true } },
      internshipReport: {
        select: {
          id: true,
          reviewStatus: true,
          reportFileName: true,
          reportMime: true,
          reportBase64: true,
          supervisorEvaluation: true,
          supervisorPoint: true,
          enterpriseEvaluation: true,
          enterprisePoint: true,
          supervisorRejectReason: true,
          reviewedAt: true,
          submittedAt: true,
          history: true
        }
      },
      internshipStatusHistory: {
        orderBy: { at: "desc" },
        select: { fromStatus: true, toStatus: true, byRole: true, message: true, at: true }
      },
      assignmentLinks: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          supervisorAssignment: {
            select: {
              status: true,
              supervisorProfile: {
                select: {
                  degree: true,
                  gender: true,
                  user: { select: { fullName: true, phone: true, email: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy sinh viên." }, { status: 404 });

  const internshipStatus = profile.internshipStatus as InternshipStatus;
  const reportReviewStatus = (profile.internshipReport?.reviewStatus ?? null) as ReportReviewStatus | null;
  const canFinalUpdate = internshipStatus === "REPORT_SUBMITTED" && reportReviewStatus === "APPROVED";

  const assignment = profile.assignmentLinks?.[0]?.supervisorAssignment ?? null;
  const supervisor = assignment?.supervisorProfile
    ? {
        fullName: assignment.supervisorProfile.user?.fullName ?? "",
        degree: assignment.supervisorProfile.degree ?? null,
        phone: assignment.supervisorProfile.user?.phone ?? null,
        email: assignment.supervisorProfile.user?.email ?? ""
      }
    : null;

  let enterprise: { companyName: string; position: string } | null = null;
  if (internshipStatus !== "SELF_FINANCED") {
    const appRow = await prismaAny.jobApplication.findFirst({
      where: { studentUserId: profile.userId, status: "OFFERED", response: "ACCEPTED" },
      select: {
        jobPost: {
          select: { title: true, enterpriseUser: { select: { companyName: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    if (appRow?.jobPost) {
      enterprise = {
        companyName: appRow.jobPost.enterpriseUser?.companyName ?? "—",
        position: appRow.jobPost.title ?? "—"
      };
    }
  }

  const report = profile.internshipReport
    ? {
        id: profile.internshipReport.id,
        reviewStatus: profile.internshipReport.reviewStatus as ReportReviewStatus,
        reportFileName: profile.internshipReport.reportFileName,
        reportUrl: dataUrlFromBase64(profile.internshipReport.reportMime, profile.internshipReport.reportBase64),
        supervisorEvaluation: profile.internshipReport.supervisorEvaluation ?? null,
        supervisorPoint: profile.internshipReport.supervisorPoint ?? null,
        enterpriseEvaluation: profile.internshipReport.enterpriseEvaluation ?? null,
        enterprisePoint: profile.internshipReport.enterprisePoint ?? null,
        supervisorRejectReason: profile.internshipReport.supervisorRejectReason ?? null,
        submittedAt: profile.internshipReport.submittedAt?.toISOString?.() ?? null,
        reviewedAt: profile.internshipReport.reviewedAt?.toISOString?.() ?? null
      }
    : null;

  return NextResponse.json({
    success: true,
    item: {
      student: {
        id: profile.id,
        msv: profile.msv,
        fullName: profile.user?.fullName ?? "",
        className: profile.className,
        faculty: profile.faculty,
        cohort: profile.cohort,
        degree: profile.degree as Degree,
        phone: profile.user?.phone ?? null,
        email: profile.user?.email ?? ""
      },
      supervisor,
      enterprise,
      internshipStatus,
      statusLabel: getStatusLabel(internshipStatus, reportReviewStatus),
      report,
      history: (profile.internshipStatusHistory || []).map((h: any) => ({
        fromStatus: h.fromStatus as InternshipStatus,
        toStatus: h.toStatus as InternshipStatus,
        at: h.at?.toISOString?.() ?? null,
        byRole: h.byRole as string,
        message: h.message ?? null
      })),
      ui: { canFinalUpdate }
    }
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { finalStatus?: "COMPLETED" | "REJECTED" };
  const finalStatus = body.finalStatus;
  if (!finalStatus || (finalStatus !== "COMPLETED" && finalStatus !== "REJECTED")) {
    return NextResponse.json({ success: false, message: "Trạng thái không hợp lệ." }, { status: 400 });
  }

  const prismaAny = prisma as any;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { id },
    select: {
      id: true,
      userId: true,
      internshipStatus: true,
      internshipReport: { select: { id: true, reviewStatus: true } }
    }
  });
  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy sinh viên." }, { status: 404 });

  const internshipStatus = profile.internshipStatus as InternshipStatus;
  const reportReviewStatus = (profile.internshipReport?.reviewStatus ?? null) as ReportReviewStatus | null;

  if (internshipStatus !== "REPORT_SUBMITTED" || reportReviewStatus !== "APPROVED") {
    return NextResponse.json({ success: false, message: "Chỉ được cập nhật khi SV đã duyệt BCTT." }, { status: 400 });
  }

  const prevStatus = internshipStatus;

  await prismaAny.$transaction(async (tx: any) => {
    if (finalStatus === "COMPLETED") {
      const assignmentLink = await tx.supervisorAssignmentStudent.findFirst({
        where: { studentProfileId: id },
        select: { supervisorAssignmentId: true },
        orderBy: { createdAt: "desc" }
      });
      if (!assignmentLink) throw new Error("Không có GVHD để cập nhật trạng thái hoàn thành.");

      await tx.studentProfile.update({
        where: { id },
        data: { internshipStatus: "COMPLETED" }
      });

      const prevAssign = await tx.supervisorAssignment.findFirst({
        where: { id: assignmentLink.supervisorAssignmentId },
        select: { status: true }
      });

      await tx.supervisorAssignment.update({
        where: { id: assignmentLink.supervisorAssignmentId },
        data: { status: "COMPLETED" }
      });

      await tx.supervisorAssignmentStatusHistory.create({
        data: {
          supervisorAssignmentId: assignmentLink.supervisorAssignmentId,
          fromStatus: (prevAssign?.status ?? "GUIDING") as any,
          toStatus: "COMPLETED",
          byRole: "admin",
          message: "Admin hoàn thành hướng dẫn"
        }
      });
    } else {
      await tx.studentProfile.update({
        where: { id },
        data: { internshipStatus: "REJECTED" }
      });
    }

    await tx.internshipStatusHistory.create({
      data: {
        studentProfileId: id,
        fromStatus: prevStatus,
        toStatus: finalStatus,
        byRole: "admin",
        message: finalStatus === "COMPLETED" ? "Admin hoàn thành thực tập" : "Admin từ chối"
      }
    });
  });

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái thực tập thành công." });
}

