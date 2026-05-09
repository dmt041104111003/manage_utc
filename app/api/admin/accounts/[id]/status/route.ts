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
  const current = await prismaAny.user.findUnique({
    where: { id },
    select: { id: true, role: true, isLocked: true }
  });
  if (!current) return NextResponse.json({ success: false, message: "Không tìm thấy tài khoản." }, { status: 404 });

  const isLocked = status === "STOPPED";

  await prismaAny.user.update({
    where: { id },
    data: { isLocked }
  });

  // When reactivating a student account, check if internshipStatus is REJECTED
  // (= "Chưa hoàn thành thực tập") and reset it to NOT_STARTED so the student
  // can start a new internship cycle.
  if (status === "ACTIVE" && current.role === "sinhvien") {
    const studentProfile = await prismaAny.studentProfile.findFirst({
      where: { userId: id },
      select: { id: true, internshipStatus: true }
    });
    if (studentProfile && studentProfile.internshipStatus === "REJECTED") {
      await prismaAny.$transaction(async (tx: any) => {
        await tx.studentProfile.update({
          where: { id: studentProfile.id },
          data: { internshipStatus: "NOT_STARTED" }
        });
        await tx.internshipStatusHistory.create({
          data: {
            studentProfileId: studentProfile.id,
            fromStatus: "REJECTED",
            toStatus: "NOT_STARTED",
            byRole: "admin",
            message: "Admin kích hoạt lại tài khoản – đặt lại trạng thái thực tập"
          }
        });
      });
    }
  }

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái tài khoản thành công." });
}
