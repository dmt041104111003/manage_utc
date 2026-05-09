import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

function parseDateOnly(input: string) {
  // input: YYYY-MM-DD
  const d = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
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

  if (role !== "doanhnghiep") return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const createdDate = (searchParams.get("createdDate") || "").trim();
  const deadlineDate = (searchParams.get("deadlineDate") || "").trim();
  const status = (searchParams.get("status") || "all").trim() as JobStatus | "all";

  const where: any = { enterpriseUserId: sub };
  const and: any[] = [];

  if (q) and.push({ title: { contains: q, mode: "insensitive" } });
  if (status !== "all") and.push({ status });

  const created = createdDate ? parseDateOnly(createdDate) : null;
  if (created) {
    const next = new Date(created);
    next.setUTCDate(next.getUTCDate() + 1);
    and.push({ createdAt: { gte: created, lt: next } });
  }

  const deadline = deadlineDate ? parseDateOnly(deadlineDate) : null;
  if (deadline) {
    const next = new Date(deadline);
    next.setUTCDate(next.getUTCDate() + 1);
    and.push({ deadlineAt: { gte: deadline, lt: next } });
  }

  if (and.length) where.AND = and;

  const prismaAny = prisma as any;

  const [rows, appStatusRows] = await Promise.all([
    prismaAny.jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        deadlineAt: true,
        recruitmentCount: true,
        status: true,
        _count: { select: { jobApplications: true } }
      }
    }),
    // Aggregate all application statuses for this enterprise (ignoring current search filters)
    prismaAny.jobApplication.findMany({
      where: { jobPost: { enterpriseUserId: sub } },
      select: { status: true }
    }) as Promise<Array<{ status: string }>>
  ]);

  const appStats = { PENDING_REVIEW: 0, INTERVIEW_INVITED: 0, OFFERED: 0, REJECTED: 0, STUDENT_DECLINED: 0 };
  for (const row of appStatusRows) {
    if (row.status in appStats) appStats[row.status as keyof typeof appStats]++;
  }

  return NextResponse.json({
    success: true,
    appStats,
    items: rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt?.toISOString?.() ?? null,
      deadlineAt: r.deadlineAt?.toISOString?.() ?? null,
      recruitmentCount: r.recruitmentCount,
      applicantCount: r._count?.jobApplications ?? 0,
      status: r.status as JobStatus
    }))
  });
}

