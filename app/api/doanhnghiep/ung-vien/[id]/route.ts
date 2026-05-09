import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const { id } = await ctx.params;
  const prismaAny = prisma as any;

  const job = await prismaAny.jobPost.findFirst({
    where: { id, enterpriseUserId: sub },
    select: {
      id: true,
      title: true,
      salary: true,
      expertise: true,
      experienceRequirement: true,
      workType: true,
      jobDescription: true,
      candidateRequirements: true,
      workLocation: true,
      workTime: true,
      benefits: true,
      applicationMethod: true,
      createdAt: true,
      deadlineAt: true,
      recruitmentCount: true,
      status: true
    }
  });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  const apps = await prismaAny.jobApplication.findMany({
    where: { jobPostId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      coverLetter: true,
      cvUrl: true,
      interviewAt: true,
      response: true,
      responseAt: true,
      history: true,
      createdAt: true,
      studentUser: { select: { id: true, fullName: true, email: true, phone: true } }
    }
  });

  return NextResponse.json({
    success: true,
    job: {
      ...job,
      createdAt: job.createdAt?.toISOString?.() ?? null,
      deadlineAt: job.deadlineAt?.toISOString?.() ?? null
    },
    applicants: apps.map((a: any) => ({
      id: a.id,
      appliedAt: a.createdAt?.toISOString?.() ?? null,
      status: a.status,
      coverLetter: a.coverLetter ?? null,
      cvUrl: a.cvUrl ?? null,
      interviewAt: a.interviewAt?.toISOString?.() ?? null,
      response: a.response,
      responseAt: a.responseAt?.toISOString?.() ?? null,
      history: a.history ?? null,
      student: {
        id: a.studentUser.id,
        fullName: a.studentUser.fullName,
        email: a.studentUser.email,
        phone: a.studentUser.phone ?? null
      }
    }))
  });
}

