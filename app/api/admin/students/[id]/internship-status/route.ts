import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

const ALLOWED = ["NOT_STARTED", "DOING", "SELF_FINANCED", "REPORT_SUBMITTED", "COMPLETED", "REJECTED"] as const;
type InternshipStatus = (typeof ALLOWED)[number];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { internshipStatus?: InternshipStatus };

  const internshipStatus = body.internshipStatus;
  if (!internshipStatus || !ALLOWED.includes(internshipStatus)) {
    return NextResponse.json({ success: false, message: "Trạng thái thực tập không hợp lệ." }, { status: 400 });
  }

  const prismaAny = prisma as any;
  const current = await prismaAny.studentProfile.findFirst({ where: { id }, select: { id: true } });
  if (!current) return NextResponse.json({ success: false, message: "Không tìm thấy sinh viên." }, { status: 404 });

  await prismaAny.studentProfile.update({
    where: { id },
    data: { internshipStatus }
  });

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái thực tập thành công." });
}

