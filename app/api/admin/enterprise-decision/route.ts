import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { sendEnterpriseApprovedEmail, sendEnterpriseRejectedEmail } from "@/lib/mail-enterprise";

type Body = {
  userId?: string;
  action?: "approve" | "reject";
  reasons?: string[];
};

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = (await request.json()) as Body;
  const userId = body.userId?.trim();
  const action = body.action;
  const reasons = Array.isArray(body.reasons)
    ? body.reasons.map((r) => String(r).trim()).filter(Boolean)
    : [];

  if (!userId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ message: "Thiếu thông tin xử lý." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== Role.doanhnghiep || user.enterpriseStatus !== EnterpriseStatus.PENDING) {
    return NextResponse.json({ message: "Hồ sơ không hợp lệ hoặc đã xử lý." }, { status: 404 });
  }

  if (action === "reject" && reasons.length === 0) {
    return NextResponse.json({ message: "Vui lòng nhập ít nhất một lý do từ chối." }, { status: 400 });
  }

  const companyName = user.companyName || "";
  const prevMeta =
    user.enterpriseMeta && typeof user.enterpriseMeta === "object" && !Array.isArray(user.enterpriseMeta)
      ? { ...(user.enterpriseMeta as Record<string, unknown>) }
      : {};

  if (action === "approve") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        enterpriseStatus: EnterpriseStatus.APPROVED,
        enterpriseMeta: {
          ...prevMeta,
          approvedAt: new Date().toISOString(),
          approvedByAdminId: admin.sub
        }
      }
    });
    let mailError: string | null = null;
    try {
      await sendEnterpriseApprovedEmail(user.email, companyName, user.email);
    } catch (e) {
      mailError = e instanceof Error ? e.message : "Gửi email thất bại.";
    }
    return NextResponse.json({
      success: true,
      message: "Đã phê duyệt doanh nghiệp.",
      mailError
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      enterpriseStatus: EnterpriseStatus.REJECTED,
      enterpriseMeta: {
        ...prevMeta,
        rejectedAt: new Date().toISOString(),
        rejectedByAdminId: admin.sub,
        rejectionReasons: reasons
      }
    }
  });
  let mailError: string | null = null;
  try {
    await sendEnterpriseRejectedEmail(user.email, reasons, companyName);
  } catch (e) {
    mailError = e instanceof Error ? e.message : "Gửi email thất bại.";
  }
  return NextResponse.json({
    success: true,
    message: "Đã từ chối hồ sơ.",
    mailError
  });
}
