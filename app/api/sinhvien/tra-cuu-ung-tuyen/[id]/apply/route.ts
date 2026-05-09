import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { decodeEnterpriseFilePayload } from "@/lib/enterprise-register-files";

const PHONE_PATTERN = /^\d{8,12}$/;
const CV_ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

type Body = {
  phone: string;
  email: string;
  intro: string;
  cvFileName?: string;
  cvMime?: string;
  cvBase64?: string;
  removeCv?: boolean;
};

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

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const { id } = await ctx.params;
  const body = (await request.json()) as Body;

  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const intro = (body.intro || "").trim();
  const removeCv = Boolean(body.removeCv);

  const errors: Record<string, string> = {};
  if (!PHONE_PATTERN.test(phone)) errors.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
  if (!AUTH_EMAIL_REGISTER_PATTERN.test(email)) errors.email = "Email không đúng định dạng (ví dụ: example@domain.com).";
  if (!intro) errors.intro = "Thư giới thiệu bản thân bắt buộc.";
  if (intro.length > 3000) errors.intro = "Thư giới thiệu bản thân tối đa 3000 ký tự.";

  let cvPatch: { cvFileName: string; cvMime: string; cvBase64: string } | null = null;
  if (body.cvBase64 || body.cvMime || body.cvFileName) {
    const decoded = decodeEnterpriseFilePayload(body.cvBase64, body.cvMime, CV_ALLOWED_MIMES);
    if (!decoded.ok) {
      errors.cv = decoded.message;
    } else {
      cvPatch = {
        cvFileName: (body.cvFileName || "cv").trim(),
        cvMime: decoded.mime,
        cvBase64: decoded.base64
      };
    }
  }
  if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

  const prismaAny = prisma as any;
  const now = new Date();
  const job = await prismaAny.jobPost.findFirst({
    where: { id, status: "ACTIVE", deadlineAt: { gte: now }, enterpriseUser: { enterpriseStatus: "APPROVED" } },
    select: { id: true }
  });
  if (!job) return NextResponse.json({ success: false, message: "Tin tuyển dụng không còn khả dụng." }, { status: 400 });

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: { internshipStatus: true, cvFileName: true, cvMime: true, cvBase64: true }
  });
  if (!profile) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });
  if (profile.internshipStatus !== "NOT_STARTED") {
    return NextResponse.json({ success: false, message: "Chỉ sinh viên có trạng thái Chưa thực tập mới được ứng tuyển." }, { status: 400 });
  }

  const existed = await prismaAny.jobApplication.findFirst({ where: { jobPostId: id, studentUserId: userId }, select: { id: true } });
  if (existed) return NextResponse.json({ success: false, message: "Bạn đã ứng tuyển tin này." }, { status: 409 });

  const existedEmail = await prismaAny.user.findFirst({ where: { email, id: { not: userId } }, select: { id: true } });
  const existedPhone = await prismaAny.user.findFirst({ where: { phone, id: { not: userId } }, select: { id: true } });
  if (existedEmail) return NextResponse.json({ success: false, errors: { email: "Email đã tồn tại trong hệ thống." } }, { status: 400 });
  if (existedPhone) return NextResponse.json({ success: false, errors: { phone: "Số điện thoại đã tồn tại trong hệ thống." } }, { status: 400 });

  const effectiveCv = cvPatch
    ? cvPatch
    : removeCv
      ? null
      : profile.cvBase64 && profile.cvMime && profile.cvFileName
        ? { cvBase64: profile.cvBase64, cvMime: profile.cvMime, cvFileName: profile.cvFileName }
        : null;
  if (!effectiveCv) return NextResponse.json({ success: false, errors: { cv: "Vui lòng đính kèm file CV." } }, { status: 400 });

  const cvUrl = `data:${effectiveCv.cvMime};base64,${effectiveCv.cvBase64}`;
  await prismaAny.$transaction(async (tx: any) => {
    await tx.user.update({ where: { id: userId }, data: { phone, email } });
    await tx.studentProfile.update({
      where: { userId },
      data: {
        intro,
        cvFileName: effectiveCv.cvFileName,
        cvMime: effectiveCv.cvMime,
        cvBase64: effectiveCv.cvBase64
      }
    });
    await tx.jobApplication.create({
      data: {
        jobPostId: id,
        studentUserId: userId,
        status: "PENDING_REVIEW",
        response: "PENDING",
        coverLetter: intro,
        cvUrl,
        history: [
          {
            action: "APPLIED",
            at: new Date().toISOString(),
            by: "STUDENT",
            status: "PENDING_REVIEW"
          }
        ]
      }
    });
  });

  return NextResponse.json({ success: true, message: "Nộp hồ sơ ứng tuyển thành công." });
}

