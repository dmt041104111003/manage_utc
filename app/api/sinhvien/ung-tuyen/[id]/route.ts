import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

type StudentAction = "CONFIRM_INTERVIEW" | "DECLINE_INTERVIEW" | "CONFIRM_INTERNSHIP" | "DECLINE_INTERNSHIP";

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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const { id } = await ctx.params;
  const body = (await request.json()) as { action?: StudentAction };
  const action = (body.action || "").trim() as StudentAction;

  if (!action) return NextResponse.json({ success: false, message: "Hành động bắt buộc." }, { status: 400 });

  const prismaAny = prisma as any;
  const app = await prismaAny.jobApplication.findFirst({
    where: { id, studentUserId: userId },
    select: {
      id: true,
      status: true,
      response: true,
      history: true
    }
  });
  if (!app) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ ứng tuyển." }, { status: 404 });

  const isInterview = app.status === "INTERVIEW_INVITED";
  const isOffered = app.status === "OFFERED";
  if (!isInterview && !isOffered) {
    return NextResponse.json({ success: false, message: "Trạng thái hiện tại không cho phép phản hồi." }, { status: 400 });
  }

  if (isInterview && !["CONFIRM_INTERVIEW", "DECLINE_INTERVIEW"].includes(action)) {
    return NextResponse.json({ success: false, message: "Chỉ được xác nhận hoặc từ chối phỏng vấn." }, { status: 400 });
  }
  if (isOffered && !["CONFIRM_INTERNSHIP", "DECLINE_INTERNSHIP"].includes(action)) {
    return NextResponse.json({ success: false, message: "Chỉ được xác nhận hoặc từ chối thực tập." }, { status: 400 });
  }

  const now = new Date();
  const prevHistory = Array.isArray(app.history) ? app.history : [];
  const historyEvent = {
    at: now.toISOString(),
    by: "STUDENT",
    action,
    fromStatus: app.status
  };

  if (action === "CONFIRM_INTERVIEW") {
    await prismaAny.jobApplication.update({
      where: { id },
      data: {
        response: "ACCEPTED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    return NextResponse.json({ success: true, message: "Đã xác nhận phỏng vấn." });
  }

  if (action === "DECLINE_INTERVIEW" || action === "DECLINE_INTERNSHIP") {
    await prismaAny.jobApplication.update({
      where: { id },
      data: {
        status: "STUDENT_DECLINED",
        response: "DECLINED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    return NextResponse.json({ success: true, message: "Đã từ chối theo phản hồi của sinh viên." });
  }

  await prismaAny.$transaction(async (tx: any) => {
    await tx.jobApplication.update({
      where: { id },
      data: {
        response: "ACCEPTED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    await tx.studentProfile.update({
      where: { userId },
      data: { internshipStatus: "DOING" }
    });
  });

  return NextResponse.json({ success: true, message: "Xác nhận thực tập thành công. Trạng thái thực tập đã chuyển sang Đang thực tập." });
}

