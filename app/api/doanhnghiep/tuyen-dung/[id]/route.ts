import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { buildEnterpriseHeadquartersAddress, formatBusinessFields } from "@/lib/utils/enterprise-admin-display";

function enterpriseMetaAsRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

const TITLE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const EXPERTISE_PATTERN = /^[\p{L}\d\s]{1,255}$/u;
const SALARY_PATTERN = /^[\p{L}\d\s\-]{1,150}$/u;
const COUNT_PATTERN = /^\d{1,10}$/;

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type JobDetailResponse = {
  job: any;
  enterprise: {
    companyName: string | null;
    taxCode: string | null;
    businessFields: string;
    headquartersAddress: string;
    intro: string | null;
    website: string | null;
  };
};

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  const { id } = await ctx.params;

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

  const job = await prismaAny.jobPost.findFirst({
    where: { id, enterpriseUserId: sub },
    include: { internshipBatch: true }
  });

  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  const user = await prismaAny.user.findUnique({
    where: { id: sub },
    select: { companyName: true, taxCode: true, enterpriseMeta: true }
  });
  const meta = enterpriseMetaAsRecord(user?.enterpriseMeta);
  const enterpriseDefaultsIntro =
    job.companyIntro ??
    (typeof meta.businessFields !== "undefined" ? formatBusinessFields(user?.enterpriseMeta) : null);
  const enterpriseDefaultsWebsite =
    job.companyWebsite ??
    (typeof meta.website === "string" && meta.website.trim() ? meta.website.trim() : null);

  const response: JobDetailResponse = {
    job,
    enterprise: {
      companyName: user?.companyName ?? null,
      taxCode: user?.taxCode ?? null,
      businessFields: formatBusinessFields(user?.enterpriseMeta),
      headquartersAddress: buildEnterpriseHeadquartersAddress(user?.enterpriseMeta),
      intro: enterpriseDefaultsIntro,
      website: enterpriseDefaultsWebsite
    }
  };

  return NextResponse.json({ success: true, item: response });
}

type EditBody = {
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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  const { id } = await ctx.params;

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

  const body = (await request.json()) as EditBody;
  const prismaAny = prisma as any;
  const job = await prismaAny.jobPost.findFirst({ where: { id, enterpriseUserId: sub } });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  if (job.status === "ACTIVE" || job.status === "STOPPED") {
    return NextResponse.json({ success: false, message: "Không thể sửa tin đã được duyệt hoặc đã dừng hoạt động." }, { status: 403 });
  }

  const errors: Record<string, string> = {};
  const title = (body.title || "").trim();
  if (!title || !TITLE_PATTERN.test(title)) errors.title = "Tiêu đề chỉ gồm ký tự chữ và số (dài 1–255).";

  const salary = (body.salary || "").trim();
  if (!salary || !SALARY_PATTERN.test(salary)) errors.salary = "Mức lương chỉ gồm ký tự chữ và số, ký tự '-' (dài 1–150).";

  const expertise = (body.expertise || "").trim();
  if (!expertise || !EXPERTISE_PATTERN.test(expertise)) errors.expertise = "Chuyên môn chỉ gồm ký tự chữ và số (dài 1–255).";

  const expReq = (body.experienceRequirement || "").trim();
  if (!expReq || !EXPERTISE_PATTERN.test(expReq)) errors.experienceRequirement = "Yêu cầu kinh nghiệm chỉ gồm ký tự chữ và số (dài 1–255).";

  const recruitmentCountStr = body.recruitmentCount == null ? "" : String(body.recruitmentCount).trim();
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

  if (Object.keys(errors).length) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  const user = await prismaAny.user.findUnique({ where: { id: sub }, select: { enterpriseMeta: true } });
  const meta = enterpriseMetaAsRecord(user?.enterpriseMeta);
  const defaultIntro = Array.isArray(meta.businessFields) ? meta.businessFields.map(String).join(", ") : null;
  const defaultWebsite = typeof meta.website === "string" && meta.website.trim() ? meta.website.trim() : null;

  const companyIntro =
    (body.companyIntro == null ? "" : String(body.companyIntro).trim()) || defaultIntro || null;
  const companyWebsite =
    (body.companyWebsite == null ? "" : String(body.companyWebsite).trim()) || defaultWebsite || null;

  const now = new Date();
  const deadlineAt = new Date(`${deadlineAtStr}T00:00:00.000Z`);
  const nextStatus = deadlineAt.getTime() <= now.getTime() ? "STOPPED" : "PENDING";

  await prismaAny.jobPost.update({
    where: { id },
    data: {
      title,
      companyIntro,
      companyWebsite,
      salary,
      expertise,
      experienceRequirement: expReq,
      recruitmentCount: Number(recruitmentCountStr),
      workType,
      deadlineAt,
      jobDescription,
      candidateRequirements,
      benefits,
      workLocation,
      workTime,
      applicationMethod,
      status: nextStatus,
      rejectionReason: null,
      stoppedAt: nextStatus === "STOPPED" ? now : null
    }
  });

  return NextResponse.json({ success: true, message: "Sửa tin tuyển dụng thành công." });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  const { id } = await ctx.params;

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

  const prismaAny = prisma as any;
  const job = await prismaAny.jobPost.findFirst({ where: { id, enterpriseUserId: sub }, select: { id: true } });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  const linkedCount = await prismaAny.jobApplication.count({ where: { jobPostId: id } });
  if (linkedCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể xóa Tin tuyển dụng đã có dữ liệu liên kết trong hệ thống."
      },
      { status: 409 }
    );
  }

  await prismaAny.jobPost.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Xóa tin tuyển dụng thành công." });
}

