import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const faculty = (searchParams.get("faculty") || "").trim();
  const internshipBatchId = (searchParams.get("internshipBatchId") || "").trim();
  const q = (searchParams.get("q") || "").trim();

  if (!faculty || !internshipBatchId) {
    return NextResponse.json({ success: false, message: "Thiếu khoa hoặc đợt thực tập." }, { status: 400 });
  }

  const prismaAny = prisma as any;

  const existingLinks = await prismaAny.supervisorAssignmentStudent.findMany({
    where: { supervisorAssignment: { internshipBatchId } },
    select: { studentProfileId: true }
  });
  const assignedSet = new Set(existingLinks.map((x: any) => String(x.studentProfileId)));

  const where: any = {
    faculty,
    internshipStatus: { not: "REJECTED" },
    id: { notIn: Array.from(assignedSet) }
  };

  if (q) {
    where.OR = [
      { msv: { startsWith: q } },
      ...(q.length >= 2 ? [{ user: { fullName: { contains: q, mode: "insensitive" } } }] : [])
    ];
  }

  const rows = await prismaAny.studentProfile.findMany({
    where,
    orderBy: [{ msv: "asc" }],
    select: { id: true, msv: true, degree: true, user: { select: { fullName: true } } }
  });

  return NextResponse.json({
    success: true,
    items: rows.map((r: any) => ({
      id: r.id,
      msv: r.msv,
      fullName: r.user?.fullName ?? "",
      degree: r.degree
    }))
  });
}
