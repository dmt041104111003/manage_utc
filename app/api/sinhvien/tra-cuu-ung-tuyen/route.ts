import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { buildEnterpriseHeadquartersAddress, formatBusinessFields } from "@/lib/utils/enterprise-admin-display";

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
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const workType = (searchParams.get("workType") || "all").trim();
  const province = (searchParams.get("province") || "all").trim();

  const prismaAny = prisma as any;
  const now = new Date();
  const where: any = {
    status: "ACTIVE",
    deadlineAt: { gte: now },
    enterpriseUser: { enterpriseStatus: "APPROVED" }
  };
  if (q) {
    where.OR = [
      { expertise: { contains: q, mode: "insensitive" } },
      { enterpriseUser: { companyName: { contains: q, mode: "insensitive" } } }
    ];
  }
  if (workType !== "all") where.workType = workType;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: { internshipStatus: true, faculty: true }
  });
  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  const applied = await prismaAny.jobApplication.findMany({
    where: { studentUserId: userId },
    select: { jobPostId: true }
  });
  const appliedSet = new Set(applied.map((x: any) => x.jobPostId));

  const faculty = String(profile.faculty || "").trim();
  if (faculty) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: [{ allowedFaculties: { equals: [] } }, { allowedFaculties: { has: faculty } }] }
    ];
  }

  const rows = await prismaAny.jobPost.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      expertise: true,
      salary: true,
      experienceRequirement: true,
      workType: true,
      deadlineAt: true,
      workLocation: true,
      enterpriseUser: { select: { companyName: true, enterpriseMeta: true } }
    }
  });

  function provinceFromEnterpriseMeta(meta: any): string {
    const p = String(meta?.province || "").trim();
    return p || "—";
  }

  const mapped = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      companyName: r.enterpriseUser?.companyName ?? "—",
      address: buildEnterpriseHeadquartersAddress(r.enterpriseUser?.enterpriseMeta),
      businessField: formatBusinessFields(r.enterpriseUser?.enterpriseMeta),
      province: provinceFromEnterpriseMeta(r.enterpriseUser?.enterpriseMeta),
      expertise: r.expertise,
      salary: r.salary,
      experienceRequirement: r.experienceRequirement,
      workType: r.workType,
      deadlineAt: r.deadlineAt?.toISOString?.() ?? null,
      hasApplied: appliedSet.has(r.id)
    }));

  const provinceSet = new Set<string>();
  mapped
    .map((x: any) => String(x.province || "").trim())
    .filter((x: string) => x && x !== "—")
    .forEach((x: string) => provinceSet.add(x));

  const provinceOptions = Array.from(provinceSet).sort((a, b) => a.localeCompare(b, "vi"));

  const items = mapped
    .filter((r: any) => (province === "all" ? true : String(r.province || "").trim() === province))
    .map(({ province: _p, ...rest }: any) => rest);

  return NextResponse.json({
    success: true,
    internshipStatus: profile.internshipStatus,
    canApply: profile.internshipStatus === "NOT_STARTED",
    provinceOptions,
    items
  });
}

