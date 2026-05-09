import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

async function getGiangVienProfileId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "giangvien") return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    const sup = await prisma.supervisorProfile.findFirst({ where: { userId: verified.sub }, select: { id: true } });
    if (!sup) return { error: NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ giảng viên." }, { status: 404 }) };
    return { supervisorProfileId: sup.id as string };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function PATCH(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const giangVien = await getGiangVienProfileId();
  if ("error" in giangVien) return giangVien.error;
  const supervisorProfileId = giangVien.supervisorProfileId;

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const student = await prismaAny.studentProfile.findFirst({
    where: { id },
    select: { id: true, internshipStatus: true, userId: true }
  });
  if (!student) return NextResponse.json({ success: false, message: "Không tìm thấy sinh viên." }, { status: 404 });

  const assigned = await prismaAny.supervisorAssignmentStudent.findFirst({
    where: { studentProfileId: id, supervisorAssignment: { supervisorProfileId } },
    select: { supervisorAssignmentId: true }
  });
  if (!assigned) return NextResponse.json({ success: false, message: "Không có quyền cập nhật." }, { status: 403 });

  if (student.internshipStatus !== "NOT_STARTED") {
    return NextResponse.json({ success: false, message: "Chỉ được cập nhật khi SV đang ở trạng thái Chưa thực tập." }, { status: 400 });
  }

  await prismaAny.$transaction(async (tx: any) => {
    await tx.studentProfile.update({
      where: { id },
      data: { internshipStatus: "SELF_FINANCED" }
    });
    await tx.internshipStatusHistory.create({
      data: {
        studentProfileId: id,
        fromStatus: "NOT_STARTED",
        toStatus: "SELF_FINANCED",
        byRole: "giangvien",
        message: "GVHD cập nhật Thực tập tự túc",
        meta: { action: "SELF_FINANCED" }
      }
    });
  });

  return NextResponse.json({ success: true, message: "Đã cập nhật trạng thái thực tập thành Thực tập tự túc." });
}

