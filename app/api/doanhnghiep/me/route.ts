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
    return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
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
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };

  return NextResponse.json({ success: true, item: out });
}

type PatchEnterpriseMeBody = {
  representativeName?: string;
  representativeTitle?: string;
  businessFields?: string[];
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
    return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  if (role !== "doanhnghiep") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = (await request.json()) as PatchEnterpriseMeBody;
  const representativeName = body.representativeName?.trim() || "";
  const representativeTitle = body.representativeTitle?.trim() || "";
  const businessFields = Array.isArray(body.businessFields) ? body.businessFields.map((x) => String(x).trim()).filter(Boolean) : [];
  const website = typeof body.website === "string" ? body.website.trim() : body.website ?? null;
  const websiteOrNull = website && website.trim() ? website.trim() : null;

  if (!representativeName || representativeName.length > 255 || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(representativeName)) {
    return NextResponse.json({ success: false, field: "representativeName", message: "Họ và tên chỉ gồm ký tự chữ, dài 1-255 ký tự." }, { status: 400 });
  }

  if (!representativeTitle || representativeTitle.length > 255 || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(representativeTitle)) {
    return NextResponse.json({ success: false, field: "representativeTitle", message: "Chức vụ chỉ gồm ký tự chữ, dài 1-255 ký tự." }, { status: 400 });
  }

  const allowedFields = DOANHNGHIEP_BUSINESS_FIELD_OPTIONS as readonly string[];
  const nextBusinessFields = businessFields.filter((x) => allowedFields.includes(x));
  if (!nextBusinessFields.length) {
    return NextResponse.json({ success: false, field: "businessFields", message: "Vui lòng chọn ít nhất 1 lĩnh vực hoạt động." }, { status: 400 });
  }

  if (websiteOrNull && !DOANHNGHIEP_REGISTER_WEBSITE_PATTERN.test(websiteOrNull)) {
    return NextResponse.json({ success: false, field: "website", message: "Website không đúng định dạng." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { id: true, enterpriseMeta: true, representativeTitle: true, fullName: true }
  });

  if (!user) return NextResponse.json({ success: false, message: "Không tìm thấy tài khoản." }, { status: 404 });

  const prevMeta = enterpriseMetaAsRecord(user.enterpriseMeta);
  const nextMeta = {
    ...prevMeta,
    representativeName,
    representativeTitle,
    businessFields: nextBusinessFields,
    website: websiteOrNull
  };

  await prisma.user.update({
    where: { id: sub },
    data: {
      fullName: representativeName,
      representativeTitle,
      enterpriseMeta: nextMeta
    }
  });

  return NextResponse.json({ success: true, message: "Đã cập nhật thông tin tài khoản doanh nghiệp." });
}

