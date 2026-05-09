import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const link = await prismaAny.supervisorAssignmentStudent.findFirst({
    where: { id },
    select: { id: true, studentProfileId: true, supervisorAssignmentId: true, studentProfile: { select: { userId: true } } }
  });
  if (!link) return NextResponse.json({ success: false, message: "Không tìm thấy phân công." }, { status: 404 });

  // Keep previous safety: don't allow removing if student has linked data.
  const studentUserId = link.studentProfile?.userId ? String(link.studentProfile.userId) : "";
  if (studentUserId) {
    const linkedCount = await prismaAny.jobApplication.count({ where: { studentUserId } });
    if (linkedCount > 0) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa phân công đã có dữ liệu liên kết trong hệ thống." },
        { status: 400 }
      );
    }
  }

  await prismaAny.supervisorAssignmentStudent.delete({ where: { id: link.id } });

  // If this was the last student, keep assignment record (avoids FK issues with history).
  return NextResponse.json({ success: true, message: "Xóa phân công thành công. Sinh viên đã ở trạng thái chưa có giảng viên hướng dẫn." });
}

