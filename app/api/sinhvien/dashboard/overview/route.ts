import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Chưa thực tập",
  DOING: "Đang thực tập",
  SELF_FINANCED: "Thực tập tự túc",
  REPORT_SUBMITTED: "Đã nộp BCTT",
  COMPLETED: "Hoàn thành",
  REJECTED: "Từ chối duyệt BCTT"
};

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
  if ("error" in auth) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: {
      internshipStatus: true,
      internshipReport: {
        select: {
          id: true,
          reviewStatus: true,
          reviewedAt: true,
          supervisorRejectReason: true
        }
      }
    }
  });

  if (!profile) {
    return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });
  }

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const report = profile.internshipReport;
  const feedbackNew =
    report && report.reviewStatus !== "PENDING" && report.reviewedAt && new Date(report.reviewedAt).getTime() >= sevenDaysAgo.getTime()
      ? 1
      : 0;

  const tasks: string[] = [];
  const status = String(profile.internshipStatus);
  if (status === "NOT_STARTED") tasks.push("Chủ động ứng tuyển để bắt đầu kỳ thực tập.");
  if (status === "DOING" || status === "SELF_FINANCED") tasks.push("Chuẩn bị và nộp báo cáo thực tập đúng hạn.");
  if (!report) tasks.push("Bạn chưa nộp báo cáo BCTT.");
  if (report?.reviewStatus === "PENDING") tasks.push("Báo cáo đang chờ giảng viên duyệt.");
  if (report?.reviewStatus === "REJECTED") {
    tasks.push(`Báo cáo bị từ chối${report.supervisorRejectReason ? `: ${report.supervisorRejectReason}` : "."}`);
    tasks.push("Cập nhật nội dung theo góp ý và nộp lại.");
  }
  if (report?.reviewStatus === "APPROVED") tasks.push("Báo cáo đã được duyệt.");
  if (tasks.length === 0) tasks.push("Hiện chưa có nhắc việc mới.");

  return NextResponse.json({
    success: true,
    item: {
      internshipStatus: STATUS_LABEL[status] ?? status,
      reportSubmittedCount: report ? 1 : 0,
      newFeedbackCount: feedbackNew,
      tasks
    }
  });
}

