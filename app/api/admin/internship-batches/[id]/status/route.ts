import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type InternshipBatchStatus = "OPEN" | "CLOSED";

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { action?: string };

  const action = body.action;
  if (action !== "close") return NextResponse.json({ message: "Thiếu hành động hợp lệ." }, { status: 400 });

  const current = await (prisma as any).internshipBatch.findUnique({
    where: { id },
    select: { id: true, status: true, endDate: true }
  });
  if (!current) return NextResponse.json({ message: "Không tìm thấy đợt thực tập." }, { status: 404 });

  const today = getTodayStart();
  const endDate = new Date(current.endDate);

  let nextStatus: InternshipBatchStatus = "CLOSED";
  if (endDate.getTime() > today.getTime()) {
    // Admin đóng kỳ sớm.
    nextStatus = "CLOSED";
  } else {
    nextStatus = "CLOSED";
  }

  await (prisma as any).internshipBatch.update({
    where: { id },
    data: { status: nextStatus }
  });

  return NextResponse.json({ success: true, message: "Đã cập nhật trạng thái đợt thực tập." });
}

