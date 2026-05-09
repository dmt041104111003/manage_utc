import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { deleteEnterpriseUserCascade } from "@/lib/admin/delete-enterprise-user";
import { sendEnterpriseApprovedEmail, sendEnterpriseRejectedEmail } from "@/lib/mail-enterprise";

export const dynamic = "force-dynamic";

type Body = {
  action?: "approve" | "reject";
  reasons?: string[];
};

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await request.json()) as Body;
  const action = body.action;
  const reasons = Array.isArray(body.reasons)
    ? body.reasons.map((r) => String(r).trim()).filter(Boolean)
    : [];

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ message: "Thiếu hành động hợp lệ." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== Role.doanhnghiep) {
    return NextResponse.json({ message: "Không tìm thấy doanh nghiệp." }, { status: 404 });
  }

  const companyName = user.companyName || "";
  const prevMeta =
    user.enterpriseMeta && typeof user.enterpriseMeta === "object" && !Array.isArray(user.enterpriseMeta)
      ? { ...(user.enterpriseMeta as Record<string, unknown>) }
      : {};

  if (action === "approve") {
    if (user.enterpriseStatus === EnterpriseStatus.APPROVED) {
      return NextResponse.json({
        success: true,
        message: "Tài khoản đã ở trạng thái đã phê duyệt (đang hoạt động).",
        alreadyApproved: true
      });
    }

    const cleanMeta = { ...prevMeta };
    delete cleanMeta.rejectedAt;
    delete cleanMeta.rejectedByAdminId;
    delete cleanMeta.rejectionReasons;

    await prisma.user.update({
      where: { id },
      data: {
        enterpriseStatus: EnterpriseStatus.APPROVED,
        enterpriseMeta: {
          ...cleanMeta,
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
      message: mailError
        ? `Đã phê duyệt. Cảnh báo gửi email: ${mailError}`
        : "Đã phê duyệt. Đã gửi email thông báo tới doanh nghiệp.",
      mailError
    });
  }

  if (reasons.length === 0) {
    return NextResponse.json({ message: "Vui lòng nhập ít nhất một lý do từ chối." }, { status: 400 });
  }

  if (user.enterpriseStatus === EnterpriseStatus.APPROVED) {
    return NextResponse.json({ message: "Không thể từ chối tài khoản đã phê duyệt." }, { status: 400 });
  }

  try {
    await sendEnterpriseRejectedEmail(user.email, reasons, companyName);
  } catch (e) {
    const mailError = e instanceof Error ? e.message : "Gửi email thất bại.";
    return NextResponse.json(
      { success: false, message: `Gửi email thất bại: ${mailError}` },
      { status: 502 }
    );
  }

  const del = await deleteEnterpriseUserCascade(id);
  if (!del.ok) {
    return NextResponse.json(
      {
        success: false,
        message: `${del.message} Email từ chối đã được gửi; vui lòng xử lý thủ công hoặc thử xóa tài khoản sau.`
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Đã gửi email từ chối và xóa tài khoản doanh nghiệp."
  });
}
