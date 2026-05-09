import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  const { id } = await ctx.params;

  let sub: string;
  let role: string;
  try {
    const verified = await verifySession(token);
    sub = verified.sub;
    role = verified.role;
  } catch {
    return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = (await request.json()) as { action?: string };
  if (body.action !== "stop") {
    return NextResponse.json({ success: false, message: "Thiếu hành động hợp lệ." }, { status: 400 });
  }

  const prismaAny = prisma as any;
  const now = new Date();

  const job = await prismaAny.jobPost.findFirst({ where: { id, enterpriseUserId: sub } });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  if (job.status === "STOPPED") {
    return NextResponse.json({ success: true, message: "Tin tuyển dụng đã dừng hoạt động." });
  }

  await prismaAny.jobPost.update({
    where: { id },
    data: { status: "STOPPED", stoppedAt: now }
  });

  return NextResponse.json({ success: true, message: "Đã dừng hoạt động tin tuyển dụng." });
}

