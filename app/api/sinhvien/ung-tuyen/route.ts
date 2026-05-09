import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

async function getStudentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "sinhvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    return { userId: verified.sub };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET(request: Request) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") || "all").trim();
  const where: any = { studentUserId: userId };
  if (status !== "all") {
    if (status === "REJECTED") {
      where.status = { in: ["REJECTED", "STUDENT_DECLINED"] };
    } else {
      where.status = status;
    }
  }

  const rows = await prismaAny.jobApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      response: true,
      createdAt: true,
      interviewAt: true,
      responseAt: true,
      jobPost: {
        select: {
          id: true,
          title: true,
          expertise: true,
          workType: true,
          deadlineAt: true,
          enterpriseUser: { select: { companyName: true } }
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    items: rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      response: r.response,
      appliedAt: r.createdAt?.toISOString?.() ?? null,
      interviewAt: r.interviewAt?.toISOString?.() ?? null,
      responseAt: r.responseAt?.toISOString?.() ?? null,
      job: {
        id: r.jobPost.id,
        title: r.jobPost.title,
        expertise: r.jobPost.expertise,
        workType: r.jobPost.workType,
        deadlineAt: r.jobPost.deadlineAt?.toISOString?.() ?? null,
        companyName: r.jobPost.enterpriseUser?.companyName ?? "—"
      }
    }))
  });
}

