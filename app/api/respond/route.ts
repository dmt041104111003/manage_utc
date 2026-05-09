import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRespondToken } from "@/lib/utils/respond-token";

function htmlPage(title: string, body: string, isSuccess: boolean) {
  const accentColor = isSuccess ? "#16a34a" : "#dc2626";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); padding: 40px 48px; max-width: 480px; width: 90%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    p { font-size: 15px; color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
    .badge { display: inline-block; background: ${accentColor}; color: #fff; border-radius: 6px; padding: 8px 20px; font-size: 15px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? "✅" : "❌"}</div>
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";

  if (!token) {
    return new NextResponse(
      htmlPage("Liên kết không hợp lệ", `<p>Liên kết này không hợp lệ hoặc đã hết hạn.</p>`, false),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let payload: Awaited<ReturnType<typeof verifyRespondToken>>;
  try {
    payload = await verifyRespondToken(token);
  } catch {
    return new NextResponse(
      htmlPage(
        "Liên kết đã hết hạn",
        `<p>Liên kết này đã hết hạn hoặc không hợp lệ. Phản hồi mặc định của bạn đã được ghi nhận là <strong>Từ chối</strong>.</p>`,
        false
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { purpose, appId, action } = payload;
  const prismaAny = prisma as any;

  const app = await prismaAny.jobApplication.findFirst({
    where: { id: appId },
    select: {
      id: true,
      status: true,
      response: true,
      history: true,
      studentUser: { select: { fullName: true } },
      jobPost: { select: { title: true, enterpriseUser: { select: { companyName: true } } } }
    }
  });

  if (!app) {
    return new NextResponse(
      htmlPage("Không tìm thấy hồ sơ", `<p>Hồ sơ ứng tuyển không tồn tại.</p>`, false),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Already responded
  if (app.response !== "PENDING") {
    return new NextResponse(
      htmlPage(
        "Đã phản hồi trước đó",
        `<p>Bạn đã phản hồi hồ sơ này trước đó. Không thể thay đổi phản hồi.</p>`,
        false
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const svName = app.studentUser?.fullName ?? "Sinh viên";
  const jobTitle = app.jobPost?.title ?? "vị trí";
  const company = app.jobPost?.enterpriseUser?.companyName ?? "Doanh nghiệp";

  const prevHistory = Array.isArray(app.history) ? app.history : [];
  const now = new Date();

  let newResponse: "ACCEPTED" | "DECLINED";
  let newStatus: string = app.status;

  if (action === "CONFIRM") {
    newResponse = "ACCEPTED";
    if (purpose === "respond_offer") {
      newStatus = "OFFERED"; // keep status as OFFERED but update response
    }
  } else {
    newResponse = "DECLINED";
    if (purpose === "respond_interview") {
      newStatus = "STUDENT_DECLINED";
    } else {
      newStatus = "STUDENT_DECLINED";
    }
  }

  const historyEvent = {
    at: now.toISOString(),
    by: "STUDENT",
    action: "STUDENT_RESPONSE",
    response: newResponse,
    purpose
  };

  const updateData: any = {
    response: newResponse,
    responseAt: now,
    history: [...prevHistory, historyEvent],
    status: newStatus
  };

  // If student confirms the offer, update internshipStatus to DOING
  if (purpose === "respond_offer" && action === "CONFIRM") {
    try {
      await prismaAny.$transaction(async (tx: any) => {
        await tx.jobApplication.update({ where: { id: appId }, data: updateData });

        const studentUserId = await prismaAny.jobApplication
          .findFirst({ where: { id: appId }, select: { studentUserId: true } })
          .then((a: any) => a?.studentUserId);

        if (studentUserId) {
          await tx.studentProfile.updateMany({
            where: { userId: studentUserId },
            data: { internshipStatus: "DOING" }
          });
        }
      });
    } catch {
      await prismaAny.jobApplication.update({ where: { id: appId }, data: updateData });
    }
  } else {
    await prismaAny.jobApplication.update({ where: { id: appId }, data: updateData });
  }

  const isConfirm = action === "CONFIRM";
  const actionLabel =
    purpose === "respond_interview"
      ? isConfirm
        ? "Chấp nhận phỏng vấn"
        : "Từ chối phỏng vấn"
      : isConfirm
        ? "Xác nhận thực tập"
        : "Từ chối thực tập";

  const successMessage =
    purpose === "respond_interview"
      ? isConfirm
        ? `<p>Bạn đã <strong>chấp nhận lời mời phỏng vấn</strong> từ <strong>${company}</strong> cho vị trí <strong>"${jobTitle}"</strong>. Doanh nghiệp sẽ liên hệ với bạn sớm.</p>`
        : `<p>Bạn đã <strong>từ chối lời mời phỏng vấn</strong> từ <strong>${company}</strong> cho vị trí <strong>"${jobTitle}"</strong>.</p>`
      : isConfirm
        ? `<p>Bạn đã <strong>xác nhận thực tập</strong> tại <strong>${company}</strong> cho vị trí <strong>"${jobTitle}"</strong>. Chúc mừng ${svName}!</p>`
        : `<p>Bạn đã <strong>từ chối lời mời thực tập</strong> từ <strong>${company}</strong> cho vị trí <strong>"${jobTitle}"</strong>.</p>`;

  return new NextResponse(
    htmlPage(
      actionLabel,
      `${successMessage}<span class="badge">${actionLabel}</span>`,
      isConfirm
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
