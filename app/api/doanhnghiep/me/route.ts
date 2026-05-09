import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { EnterpriseStatus } from "@prisma/client";
import {
  DOANHNGHIEP_BUSINESS_FIELD_OPTIONS,
  DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN,
  DOANHNGHIEP_REGISTER_WEBSITE_PATTERN
} from "@/lib/constants/doanhnghiep";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import {
  ENTERPRISE_ACCOUNT_EMAIL_TAKEN,
  ENTERPRISE_ACCOUNT_ERROR_EMAIL,
  ENTERPRISE_ACCOUNT_PHONE_TAKEN,
  ENTERPRISE_ACCOUNT_UNIQUE_CONSTRAINT
} from "@/lib/constants/doanhnghiep-tai-khoan";
import { PHONE_ERROR, PHONE_PATTERN } from "@/lib/constants/sinhvien-ho-so";
import type { AdminEnterpriseDetail } from "@/lib/types/admin";
type GetEnterpriseMeResponse = AdminEnterpriseDetail;

function enterpriseMetaAsRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

export async function GET() {
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
    return NextResponse.json({ success: false, message: "Phien dang nhap khong hop le." }, { status: 401 });
  }

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      companyName: true,
      taxCode: true,
      representativeTitle: true,
      enterpriseMeta: true,
      enterpriseStatus: true,
      isLocked: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) return NextResponse.json({ success: false, message: "Không tìm thấy tài khoản." }, { status: 404 });

  const out: GetEnterpriseMeResponse = {
    id: user.id,
    email: user.email,
    phone: user.phone ?? null,
    fullName: user.fullName,
    companyName: user.companyName ?? null,
    taxCode: user.taxCode ?? null,
    representativeTitle: user.representativeTitle ?? null,
    enterpriseMeta: user.enterpriseMeta ?? {},
    enterpriseStatus: user.enterpriseStatus ?? EnterpriseStatus.PENDING,
    isLocked: Boolean((user as any).isLocked),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };

  return NextResponse.json({ success: true, item: out });
}

type PatchEnterpriseMeBody = {
  email?: string;
  phone?: string;
  representativeName?: string;
  representativeTitle?: string;
  businessFields?: string[];
  companyIntro?: string | null;
  website?: string | null;
};

export async function PATCH(request: Request) {
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
    return NextResponse.json({ success: false, message: "Phien dang nhap khong hop le." }, { status: 401 });
  }

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = (await request.json()) as PatchEnterpriseMeBody;
  const emailNorm = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phoneTrim = typeof body.phone === "string" ? body.phone.trim() : "";
  const representativeName = body.representativeName?.trim() || "";
  const representativeTitle = body.representativeTitle?.trim() || "";
  const businessFields = Array.isArray(body.businessFields) ? body.businessFields.map((x) => String(x).trim()).filter(Boolean) : [];
  const companyIntro = typeof body.companyIntro === "string" ? body.companyIntro.trim() : body.companyIntro ?? null;
  const companyIntroOrNull = companyIntro && companyIntro.trim() ? companyIntro.trim() : null;
  const website = typeof body.website === "string" ? body.website.trim() : body.website ?? null;
  const websiteOrNull = website && website.trim() ? website.trim() : null;

  if (!emailNorm || !AUTH_EMAIL_REGISTER_PATTERN.test(emailNorm)) {
    return NextResponse.json({ success: false, field: "email", message: ENTERPRISE_ACCOUNT_ERROR_EMAIL }, { status: 400 });
  }

  if (!phoneTrim || !PHONE_PATTERN.test(phoneTrim)) {
    return NextResponse.json({ success: false, field: "phone", message: PHONE_ERROR }, { status: 400 });
  }

  if (!representativeName || representativeName.length > 255 || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(representativeName)) {
    return NextResponse.json({ success: false, field: "representativeName", message: "Ho va ten chi gom ky tu chu, dai 1-255 ky tu." }, { status: 400 });
  }

  if (!representativeTitle || representativeTitle.length > 255 || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(representativeTitle)) {
    return NextResponse.json({ success: false, field: "representativeTitle", message: "Chuc vu chi gom ky tu chu, dai 1-255 ky tu." }, { status: 400 });
  }

  const allowedFields = DOANHNGHIEP_BUSINESS_FIELD_OPTIONS as readonly string[];

  if (websiteOrNull && !DOANHNGHIEP_REGISTER_WEBSITE_PATTERN.test(websiteOrNull)) {
    return NextResponse.json({ success: false, field: "website", message: "Website không đúng định dạng." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { id: true, email: true, phone: true, enterpriseMeta: true, representativeTitle: true, fullName: true }
  });

  if (!user) return NextResponse.json({ success: false, message: "Không tìm thấy tài khoản." }, { status: 404 });

  if (emailNorm !== user.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: emailNorm, NOT: { id: sub } },
      select: { id: true }
    });
    if (emailTaken) {
      return NextResponse.json({ success: false, field: "email", message: ENTERPRISE_ACCOUNT_EMAIL_TAKEN }, { status: 409 });
    }
  }

  const currentPhone = user.phone ?? "";
  if (phoneTrim !== currentPhone) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone: phoneTrim, NOT: { id: sub } },
      select: { id: true }
    });
    if (phoneTaken) {
      return NextResponse.json({ success: false, field: "phone", message: ENTERPRISE_ACCOUNT_PHONE_TAKEN }, { status: 409 });
    }
  }

  const prevMeta = enterpriseMetaAsRecord(user.enterpriseMeta);
  const prevBusinessFields = Array.isArray(prevMeta.businessFields)
    ? prevMeta.businessFields.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const nextBusinessFields =
    businessFields.length > 0
      ? businessFields.filter((x) => allowedFields.includes(x))
      : prevBusinessFields.filter((x) => allowedFields.includes(x));
  const nextMeta = {
    ...prevMeta,
    representativeName,
    representativeTitle,
    businessFields: nextBusinessFields,
    companyIntro: companyIntroOrNull,
    website: websiteOrNull
  };

  try {
    await prisma.user.update({
      where: { id: sub },
      data: {
        email: emailNorm,
        phone: phoneTrim,
        fullName: representativeName,
        representativeTitle,
        enterpriseMeta: nextMeta
      }
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return NextResponse.json({ success: false, message: ENTERPRISE_ACCOUNT_UNIQUE_CONSTRAINT }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ success: true, message: "Đã cập nhật thông tin tài khoản doanh nghiệp." });
}
