import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import { sendMail } from "@/lib/mail";
import { getPublicAppUrl } from "@/lib/mail-enterprise";

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
    if (reportReviewStatus === "REJECTED") return "BCTT bị giảng viên hướng dẫn từ chối";
    return "Chờ giảng viên hướng dẫn duyệt";
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
  const canFinalUpdate = internshipStatus !== "COMPLETED" && internshipStatus !== "REJECTED";

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
      msv: true,
      internshipStatus: true,
      user: { select: { fullName: true, email: true } },
      assignmentLinks: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          supervisorAssignment: {
            select: {
              id: true,
              status: true,
              supervisorProfile: {
                select: {
                  user: { select: { fullName: true, email: true } }
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

  if (internshipStatus === "COMPLETED" || internshipStatus === "REJECTED") {
    return NextResponse.json({ success: false, message: "Trạng thái thực tập đã ở trạng thái cuối cùng, không thể cập nhật lại." }, { status: 400 });
  }

  const prevStatus = internshipStatus;
  const svFullName: string = profile.user?.fullName ?? "Sinh viên";
  const svEmail: string | null = profile.user?.email ?? null;

  const supervisorAssignment = profile.assignmentLinks?.[0]?.supervisorAssignment ?? null;
  const gvFullName: string = supervisorAssignment?.supervisorProfile?.user?.fullName ?? "Giảng viên";
  const gvEmail: string | null = supervisorAssignment?.supervisorProfile?.user?.email ?? null;

  await prismaAny.$transaction(async (tx: any) => {
    if (finalStatus === "COMPLETED") {
      await tx.studentProfile.update({ where: { id }, data: { internshipStatus: "COMPLETED" } });

      if (supervisorAssignment?.id) {
        await tx.supervisorAssignment.update({
          where: { id: supervisorAssignment.id },
          data: { status: "COMPLETED" }
        });
        await tx.supervisorAssignmentStatusHistory.create({
          data: {
            supervisorAssignmentId: supervisorAssignment.id,
            fromStatus: (supervisorAssignment.status ?? "GUIDING") as any,
            toStatus: "COMPLETED",
            byRole: "admin",
            message: "Admin hoàn thành hướng dẫn thực tập"
          }
        });
      }
    } else {
      // REJECTED = "Chưa hoàn thành thực tập"
      await tx.studentProfile.update({ where: { id }, data: { internshipStatus: "REJECTED" } });

      if (supervisorAssignment?.id) {
        await tx.supervisorAssignment.update({
          where: { id: supervisorAssignment.id },
          data: { status: "COMPLETED" }
        });
        await tx.supervisorAssignmentStatusHistory.create({
          data: {
            supervisorAssignmentId: supervisorAssignment.id,
            fromStatus: (supervisorAssignment.status ?? "GUIDING") as any,
            toStatus: "COMPLETED",
            byRole: "admin",
            message: "Admin hoàn thành hướng dẫn (SV chưa hoàn thành thực tập)"
          }
        });
      }

      // Lock student account
      await tx.user.update({
        where: { id: profile.userId },
        data: { isLocked: true }
      });
    }

    await tx.internshipStatusHistory.create({
      data: {
        studentProfileId: id,
        fromStatus: prevStatus,
        toStatus: finalStatus,
        byRole: "admin",
        message:
          finalStatus === "COMPLETED"
            ? "Admin xác nhận hoàn thành thực tập"
            : "Admin xác nhận chưa hoàn thành thực tập – tài khoản bị tạm dừng"
      }
    });
  });

  // Send email notifications
  try {
    const appUrl = getPublicAppUrl();
    if (finalStatus === "COMPLETED") {
      if (svEmail) {
        await sendMail(
          svEmail,
          "[UTC] Kết quả thực tập của bạn đã có",
          `Kính gửi ${svFullName},\n\nKết quả thực tập của bạn đã được Admin xác nhận: Hoàn thành thực tập.\n\nVui lòng đăng nhập hệ thống để xem chi tiết kết quả.\nĐường dẫn hệ thống: ${appUrl}/sinhvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      }
      if (gvEmail) {
        await sendMail(
          gvEmail,
          `[UTC] Hoàn thành hướng dẫn thực tập – Sinh viên ${svFullName}`,
          `Kính gửi ${gvFullName},\n\nAdmin đã xác nhận sinh viên ${svFullName} hoàn thành thực tập.\nPhân công hướng dẫn của bạn đối với sinh viên này đã được cập nhật thành "Hoàn thành hướng dẫn".\nĐường dẫn hệ thống: ${appUrl}/giangvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      }
    } else {
      if (svEmail) {
        await sendMail(
          svEmail,
          "[UTC] Thông báo kết quả thực tập",
          `Kính gửi ${svFullName},\n\nAdmin thông báo: Kết quả thực tập của bạn là Chưa hoàn thành thực tập.\n\nTài khoản của bạn hiện đã bị tạm dừng hoạt động. Vui lòng liên hệ với bộ phận quản lý để được hỗ trợ.\nĐường dẫn hệ thống: ${appUrl}/auth/dangnhap\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      }
    }
  } catch {
    // Email failure must not block the main response
  }

  const msg =
    finalStatus === "COMPLETED"
      ? "Xác nhận hoàn thành thực tập thành công. Email đã gửi cho SV và GVHD."
      : "Xác nhận chưa hoàn thành thực tập. Tài khoản SV đã bị tạm dừng.";

  return NextResponse.json({ success: true, message: msg });
}

