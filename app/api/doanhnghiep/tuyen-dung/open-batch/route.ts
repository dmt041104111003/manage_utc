import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const prismaAny = prisma as any;
  const now = new Date();
  // Auto-close khi quá hạn.
  await prismaAny.internshipBatch.updateMany({
    where: { endDate: { lt: now }, status: "OPEN" },
    data: { status: "CLOSED" }
  });
  const openBatch = await prismaAny.internshipBatch.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    hasOpenBatch: Boolean(openBatch),
    batchId: openBatch?.id ?? null
  });
}

