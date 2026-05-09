import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function enterpriseMetaAsRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

function parseDateOnly(input: string | null | undefined): { start: Date; end: Date } | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const start = new Date(`${trimmed}T00:00:00.000Z`);
  const end = new Date(`${trimmed}T23:59:59.999Z`);
  return { start, end };
}


const TITLE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const EXPERTISE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const SALARY_PATTERN = /^[\p{L}\d\s\-]{1,150}$/u;
const COUNT_PATTERN = /^\d{1,10}$/;

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

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const date = searchParams.get("date") || "";
  const status = (searchParams.get("status") || "all").trim();

  const prismaAny = prisma as any;
  const now = new Date();

  await prismaAny.jobPost.updateMany({
    where: {
      enterpriseUserId: sub,
      deadlineAt: { lt: now },
      status: { in: ["PENDING", "REJECTED", "ACTIVE"] }
    },
    data: { status: "STOPPED", stoppedAt: now }
  });

  const where: Record<string, unknown> = { enterpriseUserId: sub };

  if (q) {
    where.OR = [{ title: { contains: q, mode: "insensitive" } }, { expertise: { contains: q, mode: "insensitive" } }];
  }

  if (status && status !== "all") {
    where.status = status;
  }

  const dateRange = parseDateOnly(date);
  if (dateRange) {
    where.createdAt = { gte: dateRange.start, lte: dateRange.end };
  }

  const rows = await prismaAny.jobPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      recruitmentCount: true,
      expertise: true,
      workType: true,
      status: true,
      deadlineAt: true
    }
  });

  return NextResponse.json({
    success: true,
    items: rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt?.toISOString?.() ?? null,
      recruitmentCount: r.recruitmentCount,
      expertise: r.expertise,
      workType: r.workType,
      status: r.status,
      deadlineAt: r.deadlineAt?.toISOString?.() ?? null
    }))
  });
}

type PatchOrCreateBody = {
  title?: string;
  companyIntro?: string | null;
  companyWebsite?: string | null;
  salary?: string;
  expertise?: string;
  experienceRequirement?: string;
  recruitmentCount?: number | string;
  workType?: "PART_TIME" | "FULL_TIME";
  deadlineAt?: string; // YYYY-MM-DD
  jobDescription?: string;
  candidateRequirements?: string;
  benefits?: string;
  workLocation?: string;
  workTime?: string;
  applicationMethod?: string | null;
};

function validateCreateOrEdit(body: PatchOrCreateBody, enterpriseDefaults: { intro: string | null; website: string | null }) {
  const errors: Record<string, string> = {};

  const title = (body.title || "").trim();
  if (!title || !TITLE_PATTERN.test(title)) errors.title = "Tiêu đề chỉ gồm ký tự chữ và số (dài 1–255).";

  const salary = (body.salary || "").trim();
  if (!salary || !SALARY_PATTERN.test(salary)) errors.salary = "Mức lương chỉ gồm ký tự chữ và số, ký tự '-' (dài 1–150).";

  const expertise = (body.expertise || "").trim();
  if (!expertise || !EXPERTISE_PATTERN.test(expertise)) errors.expertise = "Chuyên môn chỉ gồm ký tự chữ và số (dài 1–255).";

  const expReq = (body.experienceRequirement || "").trim();
  if (!expReq || !EXPERTISE_PATTERN.test(expReq)) errors.experienceRequirement = "Yêu cầu kinh nghiệm chỉ gồm ký tự chữ và số (dài 1–255).";

  const recruitmentCountRaw = body.recruitmentCount;
  const recruitmentCountStr = recruitmentCountRaw == null ? "" : String(recruitmentCountRaw).trim();
  if (!recruitmentCountStr || !COUNT_PATTERN.test(recruitmentCountStr)) errors.recruitmentCount = "Số lượng tuyển dụng chỉ gồm số (dài 1–10).";

  const workType = body.workType;
  if (!workType || (workType !== "PART_TIME" && workType !== "FULL_TIME")) errors.workType = "Hình thức làm việc không hợp lệ.";

  const deadlineAtStr = (body.deadlineAt || "").trim();
  if (!deadlineAtStr || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineAtStr)) {
    errors.deadlineAt = "Hạn tuyển dụng không hợp lệ (YYYY-MM-DD).";
  } else {
    const deadlineAt = new Date(`${deadlineAtStr}T00:00:00.000Z`);
    const today = getTodayStart();
    if (!(deadlineAt.getTime() > today.getTime())) {
      errors.deadlineAt = "Hạn tuyển dụng phải lớn hơn ngày hiện tại.";
    }
  }

  const jobDescription = (body.jobDescription || "").trim();
  if (!jobDescription) errors.jobDescription = "Vui lòng nhập mô tả công việc.";

  const candidateRequirements = (body.candidateRequirements || "").trim();
  if (!candidateRequirements) errors.candidateRequirements = "Vui lòng nhập yêu cầu ứng viên.";

  const benefits = (body.benefits || "").trim();
  if (!benefits) errors.benefits = "Vui lòng nhập quyền lợi.";

  const workLocation = (body.workLocation || "").trim();
  if (!workLocation || workLocation.length > 255) errors.workLocation = "Địa điểm làm việc bắt buộc và tối đa 255 ký tự.";

  const workTime = (body.workTime || "").trim();
  if (!workTime) errors.workTime = "Vui lòng nhập thời gian làm việc.";

  const applicationMethod = body.applicationMethod == null ? null : (String(body.applicationMethod).trim() || null);

  const companyIntro =
    (body.companyIntro == null ? "" : String(body.companyIntro).trim()) || enterpriseDefaults.intro || null;
  const companyWebsite =
    (body.companyWebsite == null ? "" : String(body.companyWebsite).trim()) || enterpriseDefaults.website || null;

  return { ok: Object.keys(errors).length === 0, errors, data: { title, salary, expertise, experienceRequirement: expReq, recruitmentCount: Number(recruitmentCountStr), workType, deadlineAt: new Date(`${deadlineAtStr}T00:00:00.000Z`), jobDescription, candidateRequirements, benefits, workLocation, workTime, applicationMethod, companyIntro, companyWebsite } };
}

export async function POST(request: Request) {
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

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = (await request.json()) as PatchOrCreateBody;

  const prismaAny = prisma as any;

  const user = await prismaAny.user.findUnique({
    where: { id: sub },
    select: { fullName: true, enterpriseMeta: true }
  });
  const meta = enterpriseMetaAsRecord(user?.enterpriseMeta);
  const defaultIntro = Array.isArray(meta.businessFields) ? meta.businessFields.map(String).join(", ") : null;
  const defaultWebsite = typeof meta.website === "string" && meta.website.trim() ? meta.website.trim() : null;

  const validated = validateCreateOrEdit(body, { intro: defaultIntro, website: defaultWebsite });
  if (!validated.ok) {
    return NextResponse.json({ success: false, errors: validated.errors }, { status: 400 });
  }

  const openBatch = await prismaAny.internshipBatch.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" }
  });

  if (!openBatch) {
    return NextResponse.json(
      { success: false, message: "Phòng đào tạo chưa mở đợt thực tập. Vui lòng chờ đến khi mở đợt thực tập." },
      { status: 400 }
    );
  }

  const data = validated.data;
  const now = new Date();

  const status = data.deadlineAt.getTime() <= now.getTime() ? "STOPPED" : "PENDING";

  const created = await prismaAny.jobPost.create({
    data: {
      enterpriseUserId: sub,
      internshipBatchId: openBatch.id,
      title: data.title,
      companyIntro: data.companyIntro,
      companyWebsite: data.companyWebsite,
      salary: data.salary,
      expertise: data.expertise,
      experienceRequirement: data.experienceRequirement,
      recruitmentCount: data.recruitmentCount,
      workType: data.workType,
      deadlineAt: data.deadlineAt,
      jobDescription: data.jobDescription,
      candidateRequirements: data.candidateRequirements,
      benefits: data.benefits,
      workLocation: data.workLocation,
      workTime: data.workTime,
      applicationMethod: data.applicationMethod,
      status,
      stoppedAt: status === "STOPPED" ? now : null
    }
  });

  return NextResponse.json({ success: true, message: "Tạo tin tuyển dụng thành công." });
}

