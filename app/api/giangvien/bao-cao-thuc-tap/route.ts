import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { buildEnterpriseHeadquartersAddress } from "@/lib/utils/enterprise-admin-display";

const prismaAny = prisma as any;

type InternshipStatus =
  | "NOT_STARTED"
  | "DOING"
  | "SELF_FINANCED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "REJECTED";

type Degree = "BACHELOR" | "ENGINEER";
type ReportReviewStatus = "PENDING" | "REJECTED" | "APPROVED";

async function getGiangVienProfileId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "giangvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    const sup = await prismaAny.supervisorProfile.findFirst({ where: { userId: verified.sub }, select: { id: true } });
    if (!sup) return { error: NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ giảng viên." }, { status: 404 }) };
    return { supervisorProfileId: sup.id as string };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

function internshipStatusText(status: InternshipStatus, reviewStatus: ReportReviewStatus | null) {
  if (status === "REPORT_SUBMITTED") {
    if (reviewStatus === "APPROVED") return "Đã duyệt BCTT";
    if (reviewStatus === "REJECTED") return "Từ chối duyệt BCTT";
    return "Đã nộp BCTT";
  }
  if (status === "REJECTED") return "Từ chối duyệt BCTT";
  if (status === "COMPLETED") return "Hoàn thành thực tập";
  if (status === "DOING") return "Đang thực tập";
  if (status === "SELF_FINANCED") return "Thực tập tự túc";
  return "Chưa thực tập";
}

export async function GET(request: Request) {
  const giangVien = await getGiangVienProfileId();
  if ("error" in giangVien) return giangVien.error;
  const supervisorProfileId = giangVien.supervisorProfileId;

  // --- Latest batch internship progress stats (for cards) ---
  const latestAssignment = await prismaAny.supervisorAssignment.findFirst({
    where: { supervisorProfileId },
    orderBy: { internshipBatch: { startDate: "desc" } },
    select: {
      internshipBatchId: true,
      internshipBatch: { select: { name: true, startDate: true } }
    }
  });

  let latestBatchInternshipStats: {
    batchId: string | null;
    batchName: string | null;
    totalAssigned: number;
    notStarted: number;
    doing: number;
    selfFinanced: number;
    reportSubmitted: number;
    reportRejected: number;
    reportApproved: number;
    internshipCompleted: number;
    reportNotCompleted: number;
  } = {
    batchId: null,
    batchName: null,
    totalAssigned: 0,
    notStarted: 0,
    doing: 0,
    selfFinanced: 0,
    reportSubmitted: 0,
    reportRejected: 0,
    reportApproved: 0,
    internshipCompleted: 0,
    reportNotCompleted: 0
  };

  if (latestAssignment?.internshipBatchId) {
    const bid = String(latestAssignment.internshipBatchId);
    const batchName = latestAssignment.internshipBatch?.name ?? null;

    const latestLinks: Array<{
      studentProfile: { internshipStatus: InternshipStatus; internshipReport: { reviewStatus: ReportReviewStatus } | null };
    }> = await prismaAny.supervisorAssignmentStudent.findMany({
      where: {
        supervisorAssignment: { supervisorProfileId, internshipBatchId: bid }
      },
      select: {
        studentProfile: {
          select: {
            internshipStatus: true,
            internshipReport: { select: { reviewStatus: true } }
          }
        }
      }
    });

    let notStarted = 0;
    let doing = 0;
    let selfFinanced = 0;
    let reportSubmitted = 0;
    let reportRejected = 0;
    let reportApproved = 0;
    let internshipCompleted = 0;

    for (const x of latestLinks) {
      const s = x.studentProfile?.internshipStatus as InternshipStatus;
      const review = x.studentProfile?.internshipReport?.reviewStatus as ReportReviewStatus | undefined;

      if (s === "NOT_STARTED") notStarted++;
      else if (s === "DOING") doing++;
      else if (s === "SELF_FINANCED") selfFinanced++;
      else if (s === "COMPLETED") internshipCompleted++;

      if (s === "REPORT_SUBMITTED") {
        if (review === "APPROVED") reportApproved++;
        else if (review === "REJECTED") reportRejected++;
        else reportSubmitted++;
      } else if (s === "REJECTED") {
        // In this module, REJECTED represents report rejected.
        reportRejected++;
      }
    }

    const totalAssigned = latestLinks.length;
    const reportNotCompleted = Math.max(0, totalAssigned - reportApproved);

    latestBatchInternshipStats = {
      batchId: bid,
      batchName,
      totalAssigned,
      notStarted,
      doing,
      selfFinanced,
      reportSubmitted,
      reportRejected,
      reportApproved,
      internshipCompleted,
      reportNotCompleted
    };
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const degree = (searchParams.get("degree") || "all").trim();
  const status = (searchParams.get("status") || "all").trim();

  const degreeFilter = degree !== "all" ? (degree as Degree) : null;
  const statusFilter = status !== "all" ? (status as InternshipStatus) : null;

  const buildWhere = (useOpenBatchOnly: boolean) => {
    const where: any = {
      supervisorAssignment: {
        supervisorProfileId
      }
    };
    if (useOpenBatchOnly) where.supervisorAssignment.internshipBatch = { status: "OPEN" };
    if (statusFilter) where.studentProfile = { internshipStatus: statusFilter };
    if (degreeFilter) where.studentProfile = { ...(where.studentProfile || {}), degree: degreeFilter };
    if (q) {
      where.studentProfile = {
        ...(where.studentProfile || {}),
        OR: [
          { msv: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } }
        ]
      };
    }
    return where;
  };

  const fetchItems = async (useOpenBatchOnly: boolean) => {
    return prismaAny.supervisorAssignmentStudent.findMany({
      where: buildWhere(useOpenBatchOnly),
      orderBy: { createdAt: "desc" },
      select: {
        studentProfile: {
          select: {
            id: true,
            userId: true,
            msv: true,
            className: true,
            faculty: true,
            cohort: true,
            degree: true,
            internshipStatus: true,
            birthDate: true,
            gender: true,
            permanentProvinceName: true,
            permanentWardName: true,
            user: { select: { fullName: true, phone: true, email: true } },
            internshipReport: {
              select: {
                id: true,
                reviewStatus: true,
                reportFileName: true,
                reportMime: true,
                submittedAt: true,
                supervisorRejectReason: true,
                supervisorEvaluation: true,
                supervisorPoint: true,
                enterpriseEvaluation: true,
                enterprisePoint: true
              }
            }
          }
        },
        supervisorAssignment: {
          select: {
            internshipBatch: { select: { startDate: true, endDate: true } }
          }
        }
      }
    });
  };

  let links = await fetchItems(true);
  if (!links.length) links = await fetchItems(false);

  const userIds = links
    .map((x: any) => x.studentProfile)
    .map((sp: any) => sp.userId)
    .filter(Boolean);

  const enterpriseByUserId = new Map<string, any>();
  if (userIds.length) {
    // jobApplication không lưu internshipStatus, nên lấy theo tin tuyển dụng đã được chấp nhận.
    const apps = await prismaAny.jobApplication.findMany({
      where: {
        studentUserId: { in: userIds },
        status: "OFFERED",
        response: "ACCEPTED"
      },
      select: {
        studentUserId: true,
        jobPost: {
          select: {
            enterpriseUser: { select: { companyName: true, taxCode: true, enterpriseMeta: true } }
          }
        }
      }
    });

    for (const a of apps) {
      const eu = a.jobPost?.enterpriseUser;
      if (!eu) continue;
      enterpriseByUserId.set(String(a.studentUserId), {
        companyName: eu.companyName ?? "—",
        taxCode: eu.taxCode ?? null,
        headquartersAddress: buildEnterpriseHeadquartersAddress(eu.enterpriseMeta)
      });
    }
  }

  const items = links.map((x: any) => {
    const sp = x.studentProfile;
    const report = sp.internshipReport;
    const reviewStatus = report ? (report.reviewStatus as ReportReviewStatus) : null;
    const internshipStatus = sp.internshipStatus as InternshipStatus;

    const statusText = internshipStatusText(internshipStatus, reviewStatus);

    const canUpdateInternshipStatus = internshipStatus === "NOT_STARTED";
    const canReviewReport = internshipStatus === "REPORT_SUBMITTED" && Boolean(report) && report.reviewStatus !== "APPROVED";

    return {
      studentProfileId: sp.id,
      msv: sp.msv,
      fullName: sp.user?.fullName ?? "",
      cohort: sp.cohort,
      degree: sp.degree as Degree,
      internshipStatus: internshipStatus,
      statusText,
      birthDate: sp.birthDate?.toISOString?.() ?? null,
      gender: sp.gender ?? null,
      phone: sp.user?.phone ?? null,
      email: sp.user?.email ?? "",
      permanentAddress: [sp.permanentProvinceName, sp.permanentWardName].filter(Boolean).join(" - ") || "—",
      className: sp.className,
      faculty: sp.faculty,
      internshipBatch: {
        startDate: x.supervisorAssignment?.internshipBatch?.startDate?.toISOString?.() ?? null,
        endDate: x.supervisorAssignment?.internshipBatch?.endDate?.toISOString?.() ?? null
      },
      enterprise: enterpriseByUserId.get(String(sp.userId)) ?? null,
      report: report
        ? {
            id: report.id,
            reviewStatus: report.reviewStatus as ReportReviewStatus,
            reportFileName: report.reportFileName,
            reportMime: report.reportMime,
            submittedAt: report.submittedAt?.toISOString?.() ?? null,
            supervisorRejectReason: report.supervisorRejectReason ?? null,
            supervisorEvaluation: report.supervisorEvaluation ?? null,
            supervisorPoint: report.supervisorPoint ?? null,
            enterpriseEvaluation: report.enterpriseEvaluation ?? null,
            enterprisePoint: report.enterprisePoint ?? null
          }
        : null,
      ui: {
        canUpdateInternshipStatus,
        canReviewReport
      }
    };
  });

  return NextResponse.json({ success: true, items, latestBatchInternshipStats });
}

