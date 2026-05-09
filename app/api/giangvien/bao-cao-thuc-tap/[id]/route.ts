import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

type ReportAction = "APPROVE" | "REJECT";

const prismaAny = prisma as any;

async function getGiangVienContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "giangvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }

    const sup = await prismaAny.supervisorProfile.findFirst({
      where: { userId: verified.sub },
      select: { id: true }
    });
    if (!sup) return { error: NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ giảng viên." }, { status: 404 }) };
    return { supervisorProfileId: sup.id };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const giangVien = await getGiangVienContext();
  if ("error" in giangVien) return giangVien.error;
  const { supervisorProfileId } = giangVien;
  const { id } = await ctx.params;

  const body = (await request.json()) as {
    action?: ReportAction;
    rejectReason?: string;
    supervisorEvaluation?: string;
    supervisorPoint?: number | string | null;
    enterpriseEvaluation?: string;
    enterprisePoint?: number | string | null;
  };

  const action = (body.action || "").trim() as ReportAction;
  if (!action || (action !== "APPROVE" && action !== "REJECT")) {
    return NextResponse.json({ success: false, message: "Hành động không hợp lệ." }, { status: 400 });
  }

  const report = await prismaAny.internshipReport.findFirst({
    where: { id },
    select: {
      id: true,
      studentProfileId: true,
      reviewStatus: true,
      history: true
    }
  });
  if (!report) return NextResponse.json({ success: false, message: "Không tìm thấy BCTT." }, { status: 404 });

  const assigned = await prismaAny.supervisorAssignmentStudent.findFirst({
    where: {
      studentProfileId: report.studentProfileId,
      supervisorAssignment: { supervisorProfileId }
    },
    select: { id: true }
  });
  if (!assigned) return NextResponse.json({ success: false, message: "Không có quyền cập nhật cho sinh viên này." }, { status: 403 });

  const currentStudent = await prismaAny.studentProfile.findFirst({
    where: { id: report.studentProfileId },
    select: { internshipStatus: true, userId: true }
  });
  const prevStatus = currentStudent?.internshipStatus;

  const now = new Date();
  const historyPrev = Array.isArray(report.history) ? report.history : [];

  // Kiểm tra sinh viên có kèm DN hay không (để quyết định bắt buộc nhập KTHP).
  const enterpriseExists =
    currentStudent?.userId
      ? Boolean(
          await prismaAny.jobApplication.findFirst({
            where: { studentUserId: currentStudent.userId, status: "OFFERED", response: "ACCEPTED" },
            select: { id: true }
          })
        )
      : false;

  if (action === "REJECT") {
    const rejectReason = (body.rejectReason || "").trim();
    if (!rejectReason) return NextResponse.json({ success: false, message: "Lý do GVHD từ chối là bắt buộc." }, { status: 400 });

    await prismaAny.$transaction(async (tx: any) => {
      await tx.internshipReport.update({
        where: { id: report.id },
        data: {
          reviewStatus: "REJECTED",
          supervisorRejectReason: rejectReason,
          reviewedAt: now,
          history: [
            ...historyPrev,
            { at: now.toISOString(), by: "GIANGVIEN", action: "REJECTED", reason: rejectReason }
          ]
        }
      });

      await tx.studentProfile.update({
        where: { id: report.studentProfileId },
        data: { internshipStatus: "REJECTED" }
      });

      if (prevStatus && prevStatus !== "REJECTED") {
        await tx.internshipStatusHistory.create({
          data: {
            studentProfileId: report.studentProfileId,
            fromStatus: prevStatus,
            toStatus: "REJECTED",
            byRole: "giangvien",
            message: "GVHD từ chối duyệt BCTT",
            meta: { reportId: report.id }
          }
        });
      }
    });

    return NextResponse.json({ success: true, message: "Đã từ chối duyệt BCTT. Sinh viên có thể sửa lại." });
  }

  // APPROVE
  const noSpecialPattern = /^[\p{L}\d\s]*$/u; // Không cho ký tự đặc biệt ngoài chữ/số/khoảng trắng
  const pointPattern = /^\d+(\.\d+)?$/; // Cho phép số và dấu "."

  const supervisorEvaluationRaw = (body.supervisorEvaluation || "").trim();
  const enterpriseEvaluationRaw = (body.enterpriseEvaluation || "").trim();

  if (supervisorEvaluationRaw && !noSpecialPattern.test(supervisorEvaluationRaw)) {
    return NextResponse.json({ success: false, message: "Đánh giá GVHD không được chứa ký tự đặc biệt." }, { status: 400 });
  }
  if (enterpriseEvaluationRaw && !noSpecialPattern.test(enterpriseEvaluationRaw)) {
    return NextResponse.json({ success: false, message: "Đánh giá DN không được chứa ký tự đặc biệt." }, { status: 400 });
  }

  const supervisorPointRaw = String(body.supervisorPoint ?? "").trim();
  const enterprisePointRaw = String(body.enterprisePoint ?? "").trim();

  if (!supervisorPointRaw) return NextResponse.json({ success: false, message: "Vui lòng nhập điểm GVHD." }, { status: 400 });
  if (!pointPattern.test(supervisorPointRaw)) return NextResponse.json({ success: false, message: "Điểm GVHD không hợp lệ." }, { status: 400 });
  const supervisorPointNum = Number(supervisorPointRaw);
  if (Number.isNaN(supervisorPointNum) || supervisorPointNum < 1 || supervisorPointNum > 10) {
    return NextResponse.json({ success: false, message: "Điểm GVHD phải nằm trong khoảng 1-10." }, { status: 400 });
  }

  let enterprisePointNum: number | null = null;
  if (enterpriseExists) {
    if (!enterprisePointRaw) return NextResponse.json({ success: false, message: "Vui lòng nhập điểm DN." }, { status: 400 });
    if (!pointPattern.test(enterprisePointRaw)) return NextResponse.json({ success: false, message: "Điểm DN không hợp lệ." }, { status: 400 });
    enterprisePointNum = Number(enterprisePointRaw);
    if (Number.isNaN(enterprisePointNum) || enterprisePointNum < 1 || enterprisePointNum > 10) {
      return NextResponse.json({ success: false, message: "Điểm DN phải nằm trong khoảng 1-10." }, { status: 400 });
    }
  }

  const supervisorEvaluation = supervisorEvaluationRaw || null;
  const enterpriseEvaluation = enterpriseExists ? enterpriseEvaluationRaw || null : null;

  await prismaAny.$transaction(async (tx: any) => {
    await tx.internshipReport.update({
      where: { id: report.id },
      data: {
        reviewStatus: "APPROVED",
        supervisorRejectReason: null,
        supervisorEvaluation,
        supervisorPoint: supervisorPointNum,
        enterpriseEvaluation,
        enterprisePoint: enterprisePointNum,
        reviewedAt: now,
        history: [...historyPrev, { at: now.toISOString(), by: "GIANGVIEN", action: "APPROVED" }]
      }
    });

    // "Đã duyệt BCTT": giữ internshipStatus ở REPORT_SUBMITTED (để admin module có thể chốt).
    if (prevStatus !== "REPORT_SUBMITTED") {
      await tx.studentProfile.update({
        where: { id: report.studentProfileId },
        data: { internshipStatus: "REPORT_SUBMITTED" }
      });
      if (prevStatus) {
        await tx.internshipStatusHistory.create({
          data: {
            studentProfileId: report.studentProfileId,
            fromStatus: prevStatus,
            toStatus: "REPORT_SUBMITTED",
            byRole: "giangvien",
            message: "GVHD duyệt BCTT",
            meta: { reportId: report.id }
          }
        });
      }
    }
  });

  return NextResponse.json({ success: true, message: "Đã duyệt BCTT. Chờ admin chốt trạng thái thực tập cuối cùng." });
}

