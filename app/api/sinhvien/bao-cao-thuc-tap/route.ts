import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { decodeEnterpriseFilePayload } from "@/lib/enterprise-register-files";

const BCTT_ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

type InternshipStatus = "NOT_STARTED" | "DOING" | "SELF_FINANCED" | "REPORT_SUBMITTED" | "COMPLETED" | "REJECTED";

async function getStudentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "sinhvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    return { userId: verified.sub };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET() {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: {
      id: true,
      internshipStatus: true,
      internshipStatusHistory: {
        orderBy: { at: "desc" },
        select: { fromStatus: true, toStatus: true, at: true }
      },
      internshipReport: {
        select: {
          id: true,
          reportFileName: true,
          reportMime: true,
          reportBase64: true,
          reviewStatus: true,
          submittedAt: true,
          supervisorRejectReason: true,
          supervisorEvaluation: true,
          enterpriseEvaluation: true,
        }
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

  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  const link = profile.assignmentLinks?.[0]?.supervisorAssignment;
  const supervisor = link?.supervisorProfile
    ? {
        fullName: link.supervisorProfile.user.fullName,
        phone: link.supervisorProfile.user.phone,
        email: link.supervisorProfile.user.email,
        gender: link.supervisorProfile.gender,
        degree: link.supervisorProfile.degree
      }
    : null;

  const report = profile.internshipReport
    ? {
        id: profile.internshipReport.id,
        reviewStatus: profile.internshipReport.reviewStatus as string,
        submittedAt: profile.internshipReport.submittedAt?.toISOString?.() ?? null,
        supervisorRejectReason: profile.internshipReport.supervisorRejectReason ?? null,
        reportFileName: profile.internshipReport.reportFileName,
        reportMime: profile.internshipReport.reportMime,
        reportBase64: profile.internshipReport.reportBase64,
        supervisorEvaluation: profile.internshipReport.supervisorEvaluation ?? null,
        enterpriseEvaluation: profile.internshipReport.enterpriseEvaluation ?? null,
        supervisorPoint: null as number | null,
        enterprisePoint: null as number | null
      }
    : null;

  if (profile.internshipReport?.id) {
    try {
      const points = await prismaAny.$queryRaw<
        Array<{ supervisorPoint: number | null; enterprisePoint: number | null }>
      >`
        SELECT
          "supervisorPoint"::double precision AS "supervisorPoint",
          "enterprisePoint"::double precision AS "enterprisePoint"
        FROM "InternshipReport"
        WHERE "id" = ${profile.internshipReport.id}
      `;

      const p = points?.[0];
      if (report) {
        report.supervisorPoint = p?.supervisorPoint ?? null;
        report.enterprisePoint = p?.enterprisePoint ?? null;
      }
    } catch {
    }
  }

  const internshipStatus = profile.internshipStatus as InternshipStatus;
  const canSubmit = internshipStatus === "DOING" || internshipStatus === "SELF_FINANCED";
  const canSubmitReport = canSubmit && !report;
  const canEditReport = Boolean(report && report.reviewStatus === "REJECTED");

  return NextResponse.json({
    success: true,
    item: {
      internshipStatus,
      supervisor,
      report,
      statusHistory: (profile.internshipStatusHistory || []).map((x: any) => ({
        fromStatus: x.fromStatus,
        toStatus: x.toStatus,
        at: x.at?.toISOString?.() ?? null
      })),
      ui: {
        canSubmitReport,
        canEditReport
      }
    }
  });
}

type SubmitBody = {
  reportFileName: string;
  reportMime: string;
  reportBase64: string;
};

export async function POST(request: Request) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;
  const body = (await request.json()) as SubmitBody;

  const fileName = (body.reportFileName || "").trim();
  const decoded = decodeEnterpriseFilePayload(body.reportBase64, body.reportMime, BCTT_ALLOWED_MIMES);
  if (!fileName || !decoded.ok) {
    return NextResponse.json(
      { success: false, message: decoded.ok ? "Thiếu tên file." : decoded.message || "File báo cáo không hợp lệ." },
      { status: 400 }
    );
  }

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: { id: true, internshipStatus: true }
  });
  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  const internshipStatus = profile.internshipStatus as InternshipStatus;
  if (!(internshipStatus === "DOING" || internshipStatus === "SELF_FINANCED")) {
    return NextResponse.json({ success: false, message: "Chỉ cho phép nộp BCTT khi trạng thái thực tập là Đang thực tập / Thực tập tự túc." }, { status: 400 });
  }

  const existing = await prismaAny.internshipReport.findFirst({ where: { studentProfileId: profile.id }, select: { id: true } });
  if (existing) return NextResponse.json({ success: false, message: "Bạn đã nộp BCTT trước đó." }, { status: 409 });

  await prismaAny.$transaction(async (tx: any) => {
    await tx.internshipReport.create({
      data: {
        studentProfileId: profile.id,
        reportFileName: fileName,
        reportMime: decoded.mime,
        reportBase64: decoded.base64,
        reviewStatus: "PENDING",
        history: [
          {
            action: "SUBMITTED",
            at: new Date().toISOString(),
            by: "STUDENT"
          }
        ]
      }
    });
    await tx.studentProfile.update({
      where: { id: profile.id },
      data: { internshipStatus: "REPORT_SUBMITTED" }
    });
    await tx.internshipStatusHistory.create({
      data: {
        studentProfileId: profile.id,
        fromStatus: internshipStatus,
        toStatus: "REPORT_SUBMITTED",
        byRole: "sinhvien",
        message: "Nộp BCTT"
      }
    });
  });

  return NextResponse.json({ success: true, message: "Nộp BCTT thành công." });
}

export async function PATCH(request: Request) {
  // Sửa BCTT chỉ cho phép khi GVHD từ chối duyệt (reviewStatus = REJECTED)
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;
  const body = (await request.json()) as {
    reportFileName: string;
    reportMime: string;
    reportBase64: string;
    removeOld?: boolean;
  };

  const fileName = (body.reportFileName || "").trim();
  const decoded = decodeEnterpriseFilePayload(body.reportBase64, body.reportMime, BCTT_ALLOWED_MIMES);
  if (!fileName || !decoded.ok) {
    return NextResponse.json(
      { success: false, message: decoded.ok ? "Thiếu tên file." : decoded.message || "File báo cáo không hợp lệ." },
      { status: 400 }
    );
  }

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: { id: true, internshipStatus: true }
  });
  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  const report = await prismaAny.internshipReport.findFirst({
    where: { studentProfileId: profile.id },
    select: { id: true, reviewStatus: true }
  });
  if (!report) return NextResponse.json({ success: false, message: "Chưa có BCTT để sửa." }, { status: 404 });
  if (report.reviewStatus !== "REJECTED") return NextResponse.json({ success: false, message: "Chỉ được sửa BCTT khi GVHD từ chối." }, { status: 400 });

  await prismaAny.$transaction(async (tx: any) => {
    await tx.internshipReport.update({
      where: { id: report.id },
      data: {
        reportFileName: fileName,
        reportMime: decoded.mime,
        reportBase64: decoded.base64,
        reviewStatus: "PENDING",
        supervisorRejectReason: null,
        reviewedAt: null,
        history: [
          {
            action: "RESUBMITTED",
            at: new Date().toISOString(),
            by: "STUDENT"
          }
        ]
      }
    });
    await tx.studentProfile.update({
      where: { id: profile.id },
      data: { internshipStatus: "REPORT_SUBMITTED" }
    });
  });

  return NextResponse.json({ success: true, message: "Đã cập nhật BCTT, đang chờ GVHD duyệt." });
}

