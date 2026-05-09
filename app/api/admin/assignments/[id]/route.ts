import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type AssignmentStatus = "GUIDING" | "COMPLETED";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const row = await prismaAny.supervisorAssignment.findFirst({
    where: { id },
    select: {
      id: true,
      faculty: true,
      status: true,
      internshipBatch: { select: { id: true, name: true, semester: true, schoolYear: true, status: true } },
      supervisorProfile: { select: { id: true, faculty: true, degree: true, user: { select: { fullName: true, email: true, phone: true } } } },
      students: {
        select: {
          studentProfile: {
            select: {
              id: true,
              msv: true,
              className: true,
              faculty: true,
              cohort: true,
              degree: true,
              internshipStatus: true,
              user: { select: { fullName: true, email: true, phone: true } }
            }
          }
        }
      }
    }
  });

  if (!row) return NextResponse.json({ success: false, message: "Không tìm thấy phân công." }, { status: 404 });

  return NextResponse.json({
    success: true,
    item: {
      id: row.id,
      faculty: row.faculty,
      status: row.status as AssignmentStatus,
      batch: row.internshipBatch,
      supervisor: {
        id: row.supervisorProfile?.id ?? null,
        fullName: row.supervisorProfile?.user?.fullName ?? "",
        email: row.supervisorProfile?.user?.email ?? "",
        phone: row.supervisorProfile?.user?.phone ?? null,
        degree: row.supervisorProfile?.degree ?? null,
        faculty: row.supervisorProfile?.faculty ?? null
      },
      students: (row.students || []).map((x: any) => ({
        id: x.studentProfile?.id ?? null,
        msv: x.studentProfile?.msv ?? "",
        fullName: x.studentProfile?.user?.fullName ?? "",
        email: x.studentProfile?.user?.email ?? "",
        phone: x.studentProfile?.user?.phone ?? null,
        degree: x.studentProfile?.degree ?? null,
        className: x.studentProfile?.className ?? null,
        faculty: x.studentProfile?.faculty ?? null,
        cohort: x.studentProfile?.cohort ?? null,
        internshipStatus: x.studentProfile?.internshipStatus ?? null
      }))
    }
  });
}

type PatchBody = {
  supervisorProfileId: string;
  studentProfileIds: string[];
};

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as PatchBody;
  const supervisorProfileId = (body.supervisorProfileId || "").trim();
  const studentProfileIds = Array.isArray(body.studentProfileIds) ? body.studentProfileIds.filter(Boolean) : [];

  const errors: Record<string, string> = {};
  if (!supervisorProfileId) errors.supervisorProfileId = "GVHD bắt buộc.";
  if (!studentProfileIds.length) errors.studentProfileIds = "Danh sách sinh viên hướng dẫn bắt buộc.";
  if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

  const prismaAny = prisma as any;

  const current = await prismaAny.supervisorAssignment.findFirst({
    where: { id },
    select: { id: true, faculty: true, internshipBatchId: true, supervisorProfileId: true }
  });
  if (!current) return NextResponse.json({ success: false, message: "Không tìm thấy phân công." }, { status: 404 });

  const supervisor = await prismaAny.supervisorProfile.findUnique({ where: { id: supervisorProfileId }, select: { id: true, faculty: true } });
  if (!supervisor || supervisor.faculty !== current.faculty) {
    return NextResponse.json({ success: false, message: "GVHD không hợp lệ hoặc không thuộc khoa của phân công." }, { status: 400 });
  }

  const existingSupervisorInBatch = await prismaAny.supervisorAssignment.findFirst({
    where: { internshipBatchId: current.internshipBatchId, supervisorProfileId, NOT: { id } },
    select: { id: true }
  });
  if (existingSupervisorInBatch) {
    return NextResponse.json({ success: false, message: "GVHD đã được phân công trong đợt thực tập này." }, { status: 400 });
  }

  const students = await prismaAny.studentProfile.findMany({
    where: { id: { in: studentProfileIds } },
    select: { id: true, faculty: true, internshipStatus: true }
  });
  if (students.length !== studentProfileIds.length) {
    return NextResponse.json({ success: false, message: "Danh sách sinh viên không hợp lệ." }, { status: 400 });
  }
  for (const s of students) {
    if (s.faculty !== current.faculty) return NextResponse.json({ success: false, message: "Có sinh viên không thuộc khoa của phân công." }, { status: 400 });
    if (s.internshipStatus !== "NOT_STARTED") {
      return NextResponse.json({ success: false, message: "Chỉ được chọn sinh viên có trạng thái chưa thực tập." }, { status: 400 });
    }
  }

  const existingStudentLinks = await prismaAny.supervisorAssignmentStudent.findMany({
    where: {
      studentProfileId: { in: studentProfileIds },
      supervisorAssignment: { internshipBatchId: current.internshipBatchId },
      supervisorAssignmentId: { not: id }
    },
    select: { studentProfileId: true }
  });
  if (existingStudentLinks.length) {
    return NextResponse.json({ success: false, message: "Có sinh viên đã được phân công GVHD trong đợt thực tập đã chọn." }, { status: 400 });
  }

  await prismaAny.$transaction(
    async (tx: any) => {
      await tx.supervisorAssignment.update({
        where: { id },
        data: { supervisorProfileId, status: "GUIDING" }
      });

      await tx.supervisorAssignmentStatusHistory.create({
        data: {
          supervisorAssignmentId: id,
          fromStatus: "GUIDING",
          toStatus: "GUIDING",
          byRole: "admin",
          message: "Cập nhật phân công GVHD"
        }
      });

      await tx.supervisorAssignmentStudent.deleteMany({ where: { supervisorAssignmentId: id } });
      for (const sid of studentProfileIds) {
        await tx.supervisorAssignmentStudent.create({
          data: { supervisorAssignmentId: id, studentProfileId: sid }
        });
      }
    },
    { timeout: 30_000 }
  );

  return NextResponse.json({ success: true, message: "Cập nhật phân công thành công." });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const current = await prismaAny.supervisorAssignment.findFirst({
    where: { id },
    select: { id: true, supervisorProfileId: true }
  });
  if (!current) return NextResponse.json({ success: false, message: "Không tìm thấy phân công." }, { status: 404 });

  const studentLinks = await prismaAny.supervisorAssignmentStudent.findMany({
    where: { supervisorAssignmentId: id },
    select: { studentProfile: { select: { userId: true } } }
  });
  const studentUserIds = studentLinks.map((x: any) => String(x.studentProfile.userId));
  if (studentUserIds.length) {
    const linkedCount = await prismaAny.jobApplication.count({ where: { studentUserId: { in: studentUserIds } } });
    if (linkedCount > 0) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa phân công đã có dữ liệu liên kết trong hệ thống." },
        { status: 400 }
      );
    }
  }

  await prismaAny.$transaction(
    async (tx: any) => {
      await tx.supervisorAssignmentStudent.deleteMany({ where: { supervisorAssignmentId: id } });
      await tx.supervisorAssignment.delete({ where: { id } });
    },
    { timeout: 30_000 }
  );

  return NextResponse.json({ success: true, message: "Xóa phân công thành công." });
}

