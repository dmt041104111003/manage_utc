import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

type JobApplicationStatus = "PENDING_REVIEW" | "INTERVIEW_INVITED" | "OFFERED" | "REJECTED" | "STUDENT_DECLINED";
type JobApplicationResponse = "PENDING" | "ACCEPTED" | "DECLINED";

function nowIso() {
  return new Date().toISOString();
}

function parseDateTime(input: string) {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function canUpdateStatus(currentStatus: JobApplicationStatus, response: JobApplicationResponse, nextStatus: JobApplicationStatus) {
  if (currentStatus === "STUDENT_DECLINED") return { ok: false, message: "Ứng viên đã từ chối. Không thể cập nhật trạng thái." };
  if (response === "DECLINED") return { ok: false, message: "Ứng viên đã từ chối. Không thể cập nhật trạng thái." };

  if (nextStatus === "INTERVIEW_INVITED") return { ok: true };
  if (nextStatus === "OFFERED") {
    if (currentStatus === "INTERVIEW_INVITED" && response === "ACCEPTED") return { ok: true };
    return { ok: false, message: "Chỉ được cập nhật Trúng tuyển sau khi ứng viên đồng ý phỏng vấn." };
  }
  if (nextStatus === "REJECTED") {
    return { ok: true };
  }
  if (nextStatus === "PENDING_REVIEW") return { ok: true };
  if (nextStatus === "STUDENT_DECLINED") return { ok: false, message: "Trạng thái này do ứng viên phản hồi." };
  return { ok: false, message: "Trạng thái cập nhật không hợp lệ." };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  let sub: string;
  let role: string;
  try {
    const verified = await verifySession(token);
    sub = verified.sub;
    role = verified.role;
  } catch {
    return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }
  if (role !== "doanhnghiep") return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { status?: JobApplicationStatus; interviewAt?: string };

  const nextStatus = (body.status || "").trim() as JobApplicationStatus;
  const interviewAtRaw = (body.interviewAt || "").trim();

  if (!nextStatus) return NextResponse.json({ success: false, message: "Trạng thái bắt buộc." }, { status: 400 });

  const prismaAny = prisma as any;
  const current = await prismaAny.jobApplication.findFirst({
    where: { id },
    select: {
      id: true,
      status: true,
      response: true,
      interviewAt: true,
      history: true,
      jobPost: { select: { id: true, enterpriseUserId: true } }
    }
  });

  if (!current || current.jobPost?.enterpriseUserId !== sub) {
    return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ ứng tuyển." }, { status: 404 });
  }

  const check = canUpdateStatus(current.status, current.response, nextStatus);
  if (!check.ok) return NextResponse.json({ success: false, message: check.message }, { status: 400 });

  let interviewAt: Date | null | undefined = undefined;
  if (nextStatus === "INTERVIEW_INVITED") {
    if (!interviewAtRaw) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập thời gian mời phỏng vấn." }, { status: 400 });
    }
    const parsed = parseDateTime(interviewAtRaw);
    if (!parsed) return NextResponse.json({ success: false, message: "Thời gian mời phỏng vấn không hợp lệ." }, { status: 400 });
    interviewAt = parsed;
  }

  const prevHistory = Array.isArray(current.history) ? current.history : [];
  const history = [
    ...prevHistory,
    {
      at: nowIso(),
      by: "ENTERPRISE",
      action: "STATUS_UPDATE",
      from: current.status,
      to: nextStatus,
      interviewAt: interviewAt ? interviewAt.toISOString() : null
    }
  ];

  const data: any = {
    status: nextStatus,
    history
  };

  if (nextStatus === "INTERVIEW_INVITED") {
    data.interviewAt = interviewAt;
    data.response = "PENDING";
    data.responseAt = null;
  }

  if (nextStatus === "OFFERED") {
    data.response = "PENDING";
    data.responseAt = null;
  }

  if (nextStatus === "REJECTED") {
    // keep response as-is for audit
  }

  await prismaAny.jobApplication.update({ where: { id }, data });

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái hồ sơ thành công." });
}

