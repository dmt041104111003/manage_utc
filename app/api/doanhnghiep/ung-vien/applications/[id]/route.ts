import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { signRespondToken } from "@/lib/utils/respond-token";

type JobApplicationStatus = "PENDING_REVIEW" | "INTERVIEW_INVITED" | "OFFERED" | "REJECTED" | "STUDENT_DECLINED";
type JobApplicationResponse = "PENDING" | "ACCEPTED" | "DECLINED";

function nowIso() {
  return new Date().toISOString();
}

function parseDateTime(input: string) {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function tomorrowStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function canUpdateStatus(
  currentStatus: JobApplicationStatus,
  response: JobApplicationResponse,
  nextStatus: JobApplicationStatus
): { ok: boolean; message?: string } {
  if (currentStatus === "STUDENT_DECLINED" || currentStatus === "REJECTED") {
    return { ok: false, message: "Không thể cập nhật trạng thái sau khi đã từ chối." };
  }
  if (response === "DECLINED") {
    return { ok: false, message: "Ứng viên đã từ chối. Không thể cập nhật trạng thái." };
  }

  if (currentStatus === "PENDING_REVIEW") {
    if (["INTERVIEW_INVITED", "OFFERED", "REJECTED"].includes(nextStatus)) return { ok: true };
    return { ok: false, message: "Trạng thái cập nhật không hợp lệ." };
  }

  if (currentStatus === "INTERVIEW_INVITED") {
    if (response === "PENDING") {
      return { ok: false, message: "Đang chờ ứng viên phản hồi lời mời phỏng vấn." };
    }
    if (response === "ACCEPTED") {
      if (nextStatus === "OFFERED" || nextStatus === "REJECTED") return { ok: true };
      return { ok: false, message: "Sau khi ứng viên đồng ý phỏng vấn chỉ được cập nhật Trúng tuyển hoặc Từ chối." };
    }
    return { ok: false, message: "Ứng viên đã từ chối phỏng vấn." };
  }

  if (currentStatus === "OFFERED") {
    return { ok: false, message: "Đang chờ ứng viên phản hồi lời mời thực tập. Không thể cập nhật thêm." };
  }

  return { ok: false, message: "Trạng thái cập nhật không hợp lệ." };
}

function getBaseUrl(): string {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (base) return base;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
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
  const body = (await request.json()) as {
    status?: JobApplicationStatus;
    interviewAt?: string;
    interviewLocation?: string;
    responseDeadline?: string;
  };

  const nextStatus = (body.status || "").trim() as JobApplicationStatus;
  const interviewAtRaw = (body.interviewAt || "").trim();
  const interviewLocationRaw = (body.interviewLocation || "").trim();
  const responseDeadlineRaw = (body.responseDeadline || "").trim();

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
      jobPost: {
      select: {
        id: true,
        title: true,
        expertise: true,
        enterpriseUserId: true,
        enterpriseUser: { select: { companyName: true, email: true } }
      }
      },
      studentUser: {
        select: {
          fullName: true,
          email: true,
          studentProfile: { select: { internshipStatus: true } }
        }
      }
    }
  });

  if (!current || current.jobPost?.enterpriseUserId !== sub) {
    return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ ứng tuyển." }, { status: 404 });
  }

  // Guard: only allow updates if SV has NOT_STARTED internship status
  const svInternshipStatus = current.studentUser?.studentProfile?.internshipStatus ?? "NOT_STARTED";
  if (svInternshipStatus !== "NOT_STARTED") {
    return NextResponse.json(
      { success: false, message: "Sinh viên đã có nơi thực tập. Không thể cập nhật trạng thái hồ sơ." },
      { status: 400 }
    );
  }

  const check = canUpdateStatus(current.status, current.response, nextStatus);
  if (!check.ok) return NextResponse.json({ success: false, message: check.message }, { status: 400 });

  const svFullName: string = current.studentUser?.fullName ?? "Sinh viên";
  const svEmail: string | null = current.studentUser?.email ?? null;
  const companyName: string = current.jobPost?.enterpriseUser?.companyName ?? "Doanh nghiệp";
  const jobTitle: string = current.jobPost?.title ?? "vị trí thực tập";
  const expertiseLine = current.jobPost?.expertise ? `\n  Lĩnh vực: ${current.jobPost.expertise}` : "";

  let interviewAt: Date | null | undefined = undefined;
  let responseDeadline: Date | null = null;

  if (nextStatus === "INTERVIEW_INVITED") {
    if (!interviewAtRaw) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập thời gian phỏng vấn." }, { status: 400 });
    }
    if (!interviewLocationRaw) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập địa điểm phỏng vấn." }, { status: 400 });
    }
    if (!responseDeadlineRaw) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập thời hạn phản hồi." }, { status: 400 });
    }
    const parsedInterview = parseDateTime(interviewAtRaw);
    if (!parsedInterview) return NextResponse.json({ success: false, message: "Thời gian phỏng vấn không hợp lệ." }, { status: 400 });
    const parsedDeadline = parseDateTime(responseDeadlineRaw);
    if (!parsedDeadline) return NextResponse.json({ success: false, message: "Thời hạn phản hồi không hợp lệ." }, { status: 400 });
    const min = tomorrowStart().getTime();
    if (!(parsedInterview.getTime() >= min)) {
      return NextResponse.json({ success: false, message: "Thời gian phỏng vấn phải từ ngày mai trở đi." }, { status: 400 });
    }
    if (!(parsedDeadline.getTime() >= min)) {
      return NextResponse.json({ success: false, message: "Thời hạn phản hồi phải từ ngày mai trở đi." }, { status: 400 });
    }
    if (!(parsedDeadline.getTime() >= parsedInterview.getTime())) {
      return NextResponse.json(
        { success: false, message: "Thời hạn phản hồi phải lớn hơn hoặc bằng thời gian phỏng vấn." },
        { status: 400 }
      );
    }
    interviewAt = parsedInterview;
    responseDeadline = parsedDeadline;
  }

  if (nextStatus === "OFFERED") {
    if (!responseDeadlineRaw) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập thời hạn phản hồi." }, { status: 400 });
    }
    const parsedDeadline = parseDateTime(responseDeadlineRaw);
    if (!parsedDeadline) return NextResponse.json({ success: false, message: "Thời hạn phản hồi không hợp lệ." }, { status: 400 });
    const min = tomorrowStart().getTime();
    if (!(parsedDeadline.getTime() >= min)) {
      return NextResponse.json({ success: false, message: "Thời hạn phản hồi phải từ ngày mai trở đi." }, { status: 400 });
    }
    responseDeadline = parsedDeadline;
  }

  const prevHistory = Array.isArray(current.history) ? current.history : [];
  const historyEvent: Record<string, unknown> = {
    at: nowIso(),
    by: "ENTERPRISE",
    action: "STATUS_UPDATE",
    from: current.status,
    to: nextStatus
  };
  if (interviewAt) historyEvent.interviewAt = interviewAt.toISOString();
  if (interviewLocationRaw) historyEvent.interviewLocation = interviewLocationRaw;
  if (responseDeadline) historyEvent.responseDeadline = responseDeadline.toISOString();

  const data: any = {
    status: nextStatus,
    history: [...prevHistory, historyEvent]
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

  await prismaAny.jobApplication.update({ where: { id }, data });

  // Send email notifications
  try {
    const baseUrl = getBaseUrl();

    if (nextStatus === "INTERVIEW_INVITED" && svEmail && responseDeadline && interviewAt) {
      const confirmToken = await signRespondToken(
        { purpose: "respond_interview", appId: id, action: "CONFIRM" },
        responseDeadline
      );
      const declineToken = await signRespondToken(
        { purpose: "respond_interview", appId: id, action: "DECLINE" },
        responseDeadline
      );
      const confirmUrl = `${baseUrl}/api/respond?token=${encodeURIComponent(confirmToken)}`;
      const declineUrl = `${baseUrl}/api/respond?token=${encodeURIComponent(declineToken)}`;

      const interviewDateStr = interviewAt.toLocaleString("vi-VN");
      const deadlineStr = responseDeadline.toLocaleString("vi-VN");

      await sendMail(
        svEmail,
        `[UTC] ${companyName} mời bạn tham gia phỏng vấn – ${jobTitle}`,
        `Kính gửi ${svFullName},\n\nDoanh nghiệp ${companyName} mời bạn tham gia phỏng vấn cho vị trí "${jobTitle}".${expertiseLine}\n\nThời gian phỏng vấn: ${interviewDateStr}\nĐịa điểm: ${interviewLocationRaw}\nThời hạn phản hồi: ${deadlineStr}\n\nVui lòng nhấn một trong hai liên kết bên dưới để xác nhận:\n\n[CHẤP NHẬN PHỎNG VẤN]: ${confirmUrl}\n[TỪ CHỐI PHỎNG VẤN]: ${declineUrl}\n\nLưu ý: Sau ${deadlineStr}, hai nút trên sẽ không còn hiệu lực và phản hồi mặc định là Từ chối.\nĐường dẫn hệ thống: ${baseUrl}/sinhvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`,
        `
        <p>Kính gửi <strong>${svFullName}</strong>,</p>
        <p>Doanh nghiệp <strong>${companyName}</strong> mời bạn tham gia phỏng vấn cho vị trí <strong>"${jobTitle}"</strong>.</p>
        <table style="font-size:14px;margin:12px 0;border-collapse:collapse;">
          <tr><th style="text-align:left;padding:4px 12px 4px 0;color:#6b7280;">Thời gian:</th><td>${interviewDateStr}</td></tr>
          <tr><th style="text-align:left;padding:4px 12px 4px 0;color:#6b7280;">Địa điểm:</th><td>${interviewLocationRaw}</td></tr>
          <tr><th style="text-align:left;padding:4px 12px 4px 0;color:#6b7280;">Thời hạn phản hồi:</th><td>${deadlineStr}</td></tr>
        </table>
        <p>Vui lòng nhấn một trong hai nút bên dưới để xác nhận:</p>
        <div style="display:flex;gap:12px;margin:16px 0;">
          <a href="${confirmUrl}" style="background:#16a34a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Chấp nhận phỏng vấn</a>
          <a href="${declineUrl}" style="background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Từ chối phỏng vấn</a>
        </div>
        <p style="font-size:12px;color:#6b7280;">Lưu ý: Sau <strong>${deadlineStr}</strong>, hai nút trên sẽ không còn hiệu lực và phản hồi mặc định là Từ chối.</p>
        `
      );
    }

    if (nextStatus === "OFFERED" && svEmail && responseDeadline) {
      const confirmToken = await signRespondToken(
        { purpose: "respond_offer", appId: id, action: "CONFIRM" },
        responseDeadline
      );
      const declineToken = await signRespondToken(
        { purpose: "respond_offer", appId: id, action: "DECLINE" },
        responseDeadline
      );
      const confirmUrl = `${baseUrl}/api/respond?token=${encodeURIComponent(confirmToken)}`;
      const declineUrl = `${baseUrl}/api/respond?token=${encodeURIComponent(declineToken)}`;
      const deadlineStr = responseDeadline.toLocaleString("vi-VN");

      await sendMail(
        svEmail,
        `[UTC] ${companyName} thông báo Trúng tuyển – ${jobTitle}`,
        `Kính gửi ${svFullName},\n\nChúc mừng! Doanh nghiệp ${companyName} thông báo bạn đã TRÚNG TUYỂN vị trí "${jobTitle}".${expertiseLine}\n\nThời hạn phản hồi: ${deadlineStr}\n\nVui lòng nhấn một trong hai liên kết bên dưới:\n\n[XÁC NHẬN THỰC TẬP]: ${confirmUrl}\n[TỪ CHỐI THỰC TẬP]: ${declineUrl}\n\nĐường dẫn hệ thống: ${baseUrl}/sinhvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`,
        `
        <p>Kính gửi <strong>${svFullName}</strong>,</p>
        <p>Chúc mừng! Doanh nghiệp <strong>${companyName}</strong> thông báo bạn đã <strong>TRÚNG TUYỂN</strong> vị trí <strong>"${jobTitle}"</strong>.</p>
        <p><strong>Thời hạn phản hồi:</strong> ${deadlineStr}</p>
        <p>Vui lòng nhấn một trong hai nút bên dưới để xác nhận:</p>
        <div style="display:flex;gap:12px;margin:16px 0;">
          <a href="${confirmUrl}" style="background:#16a34a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Xác nhận thực tập</a>
          <a href="${declineUrl}" style="background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Từ chối thực tập</a>
        </div>
        <p style="font-size:12px;color:#6b7280;">Lưu ý: Sau <strong>${deadlineStr}</strong>, hai nút trên sẽ không còn hiệu lực và phản hồi mặc định là Từ chối.</p>
        `
      );
    }

    if (nextStatus === "REJECTED" && svEmail) {
      await sendMail(
        svEmail,
        `[UTC] Thông báo kết quả ứng tuyển – ${jobTitle}`,
        `Kính gửi ${svFullName},\n\nCảm ơn bạn đã ứng tuyển vào vị trí "${jobTitle}" tại ${companyName}.${expertiseLine}\n\nRất tiếc, sau khi xem xét, doanh nghiệp không thể tiếp tục tiến trình tuyển dụng với bạn.\n\nChúc bạn thành công trong việc tìm kiếm nơi thực tập phù hợp.\nĐường dẫn hệ thống: ${baseUrl}/sinhvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }
  } catch {
    // Email failure should not block the main response
  }

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái hồ sơ thành công." });
}
