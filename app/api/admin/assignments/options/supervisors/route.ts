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
  const includeId = (searchParams.get("includeId") || "").trim();

  if (!faculty || !internshipBatchId) {
    return NextResponse.json({ success: false, message: "Thiếu khoa hoặc đợt thực tập." }, { status: 400 });
  }

  const prismaAny = prisma as any;

  const assigned = await prismaAny.supervisorAssignment.findMany({
    where: { internshipBatchId },
    select: { supervisorProfileId: true }
  });
  const assignedSet = new Set(assigned.map((x: any) => String(x.supervisorProfileId)));
  if (includeId) assignedSet.delete(includeId);

  const where: any = {
    faculty: { equals: faculty, mode: "insensitive" },
    id: { notIn: Array.from(assignedSet) },
    user: { isLocked: false }
  };
  if (q) {
    where.AND = [{ user: { fullName: { contains: q, mode: "insensitive" } } }];
  }

  const rows = await prismaAny.supervisorProfile.findMany({
    where,
    orderBy: { user: { fullName: "asc" } },
    select: { id: true, faculty: true, degree: true, user: { select: { fullName: true } } }
  });

  return NextResponse.json({
    success: true,
    items: rows.map((r: any) => ({
      id: r.id,
      fullName: r.user?.fullName ?? "",
      degree: r.degree,
      faculty: r.faculty
    }))
  });
}

