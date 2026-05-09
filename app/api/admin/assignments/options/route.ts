import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const prismaAny = prisma as any;

  const batches = await prismaAny.internshipBatch.findMany({
    where: { status: "OPEN" },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, semester: true, schoolYear: true, startDate: true, endDate: true }
  });

  const facultiesRaw = await prismaAny.supervisorProfile.findMany({ distinct: ["faculty"], select: { faculty: true } });
  const faculties = facultiesRaw.map((r: any) => String(r.faculty)).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, "vi"));

  return NextResponse.json({
    success: true,
    faculties,
    openBatches: batches.map((b: any) => ({
      id: b.id,
      name: b.name,
      semester: b.semester,
      schoolYear: b.schoolYear,
      startDate: b.startDate?.toISOString?.() ?? null,
      endDate: b.endDate?.toISOString?.() ?? null
    }))
  });
}

