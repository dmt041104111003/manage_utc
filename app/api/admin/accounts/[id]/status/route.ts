import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type AccountStatus = "ACTIVE" | "STOPPED";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { status?: AccountStatus };
  const status = body.status;
  if (!status || !["ACTIVE", "STOPPED"].includes(status)) {
    return NextResponse.json({ success: false, message: "Trạng thái không hợp lệ." }, { status: 400 });
  }

  const prismaAny = prisma as any;
  const current = await prismaAny.user.findUnique({ where: { id }, select: { id: true } });
  if (!current) return NextResponse.json({ success: false, message: "Không tìm thấy tài khoản." }, { status: 404 });

  await prismaAny.user.update({
    where: { id },
    data: { isLocked: status === "STOPPED" }
  });

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái tài khoản thành công." });
}

