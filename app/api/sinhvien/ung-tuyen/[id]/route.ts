import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

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

async function fetchMailContext(prismaAny: any, applicationId: string) {
  const app = await prismaAny.jobApplication.findFirst({
    where: { id: applicationId },
    select: {
      jobPost: {
        select: {
          title: true,
          enterpriseUser: { select: { email: true, companyName: true } }
        }
      },
      studentUser: { select: { fullName: true, email: true, phone: true } }
    }
  });
  return {
    jobTitle: (app?.jobPost?.title ?? "") as string,
    companyName: (app?.jobPost?.enterpriseUser?.companyName ?? "") as string,
    enterpriseEmail: (app?.jobPost?.enterpriseUser?.email ?? null) as string | null,
    svFullName: (app?.studentUser?.fullName ?? "Sinh viên") as string,
    svEmail: (app?.studentUser?.email ?? null) as string | null,
    svPhone: (app?.studentUser?.phone ?? null) as string | null
  };
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

  if (app.response !== "PENDING") {
    return NextResponse.json({ success: false, message: "Bạn đã phản hồi trước đó, không thể thay đổi." }, { status: 400 });
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

  let responseMessage = "";

  if (action === "CONFIRM_INTERVIEW") {
    await prismaAny.jobApplication.update({
      where: { id },
      data: {
        response: "ACCEPTED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    responseMessage = "Đã xác nhận phỏng vấn.";
  } else if (action === "DECLINE_INTERVIEW") {
    await prismaAny.jobApplication.update({
      where: { id },
      data: {
        status: "STUDENT_DECLINED",
        response: "DECLINED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    responseMessage = "Đã từ chối phỏng vấn.";
  } else if (action === "DECLINE_INTERNSHIP") {
    await prismaAny.jobApplication.update({
      where: { id },
      data: {
        status: "STUDENT_DECLINED",
        response: "DECLINED",
        responseAt: now,
        history: [...prevHistory, historyEvent]
      }
    });
    responseMessage = "Đã từ chối thực tập.";
  } else {
    // CONFIRM_INTERNSHIP
    await prismaAny.$transaction(async (tx: any) => {
      await tx.jobApplication.update({
        where: { id },
        data: {
          response: "ACCEPTED",
          responseAt: now,
          history: [...prevHistory, historyEvent]
        }
      });

      const student = await tx.studentProfile.findFirst({
        where: { userId },
        select: { id: true, internshipStatus: true }
      });
      if (!student) throw new Error("Missing studentProfile");

      const prevStatus = student.internshipStatus;
      await tx.studentProfile.update({
        where: { userId },
        data: { internshipStatus: "DOING" }
      });
      if (prevStatus !== "DOING") {
        await tx.internshipStatusHistory.create({
          data: {
            studentProfileId: student.id,
            fromStatus: prevStatus,
            toStatus: "DOING",
            byRole: "sinhvien",
            message: "Xác nhận thực tập"
          }
        });
      }
    });
    responseMessage = "Xác nhận thực tập thành công. Trạng thái thực tập đã chuyển sang Đang thực tập.";
  }

  // Send email notifications
  try {
    const { jobTitle, companyName, enterpriseEmail, svFullName, svEmail, svPhone } =
      await fetchMailContext(prismaAny, id);

    const phoneInfo = svPhone ? ` - SĐT: ${svPhone}` : "";

    if (action === "CONFIRM_INTERVIEW" && enterpriseEmail) {
      await sendMail(
        enterpriseEmail,
        `[UTC] ${svFullName} đã xác nhận tham gia phỏng vấn – ${jobTitle}`,
        `Kính gửi ${companyName},\n\nSinh viên ${svFullName}${phoneInfo} đã XÁC NHẬN tham gia phỏng vấn cho vị trí "${jobTitle}".\n\nVui lòng liên hệ sinh viên để sắp xếp lịch phỏng vấn chi tiết.\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }
    if (action === "DECLINE_INTERVIEW" && enterpriseEmail) {
      await sendMail(
        enterpriseEmail,
        `[UTC] ${svFullName} đã từ chối tham gia phỏng vấn – ${jobTitle}`,
        `Kính gửi ${companyName},\n\nSinh viên ${svFullName} đã TỪ CHỐI tham gia phỏng vấn cho vị trí "${jobTitle}".\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }
    if (action === "CONFIRM_INTERNSHIP" && enterpriseEmail) {
      await sendMail(
        enterpriseEmail,
        `[UTC] ${svFullName} đã xác nhận nhận thực tập – ${jobTitle}`,
        `Kính gửi ${companyName},\n\nSinh viên ${svFullName}${phoneInfo} đã XÁC NHẬN tham gia thực tập tại quý doanh nghiệp cho vị trí "${jobTitle}".\n\nSinh viên sẽ liên hệ với quý doanh nghiệp để sắp xếp lịch bắt đầu thực tập.\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }
    if (action === "DECLINE_INTERNSHIP" && enterpriseEmail) {
      await sendMail(
        enterpriseEmail,
        `[UTC] ${svFullName} đã từ chối nhận thực tập – ${jobTitle}`,
        `Kính gửi ${companyName},\n\nSinh viên ${svFullName} đã TỪ CHỐI tham gia thực tập tại quý doanh nghiệp cho vị trí "${jobTitle}".\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }

    // Confirmation email to SV
    if (svEmail) {
      const svSubject =
        action === "CONFIRM_INTERVIEW"
          ? `[UTC] Xác nhận phỏng vấn tại ${companyName} – ${jobTitle}`
          : action === "DECLINE_INTERVIEW"
          ? `[UTC] Từ chối phỏng vấn tại ${companyName} – ${jobTitle}`
          : action === "CONFIRM_INTERNSHIP"
          ? `[UTC] Xác nhận thực tập tại ${companyName} – ${jobTitle}`
          : `[UTC] Từ chối thực tập tại ${companyName} – ${jobTitle}`;

      const svBody =
        action === "CONFIRM_INTERVIEW"
          ? `Kính gửi ${svFullName},\n\nBạn đã XÁC NHẬN tham gia phỏng vấn cho vị trí "${jobTitle}" tại ${companyName}. Doanh nghiệp sẽ liên hệ với bạn để sắp xếp lịch.\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
          : action === "DECLINE_INTERVIEW"
          ? `Kính gửi ${svFullName},\n\nBạn đã TỪ CHỐI tham gia phỏng vấn cho vị trí "${jobTitle}" tại ${companyName}.\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
          : action === "CONFIRM_INTERNSHIP"
          ? `Kính gửi ${svFullName},\n\nBạn đã XÁC NHẬN thực tập tại ${companyName} cho vị trí "${jobTitle}". Trạng thái thực tập của bạn đã được cập nhật sang "Đang thực tập".\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
          : `Kính gửi ${svFullName},\n\nBạn đã TỪ CHỐI thực tập tại ${companyName} cho vị trí "${jobTitle}".\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`;

      await sendMail(svEmail, svSubject, svBody);
    }
  } catch {
    // Email failure should not block the main response
  }

  return NextResponse.json({ success: true, message: responseMessage });
}
