import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { validateEnterpriseRegisterPayload, type EnterpriseRegisterPayload } from "@/lib/enterprise-register-validate";
import {
  MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX,
  MAIL_PRODUCT_NAME,
  MAIL_TRANSACTIONAL_SIGN_OFF,
  SCHOOL_FULL_NAME
} from "@/lib/constants/school";
import { MAIL_BRAND } from "@/lib/mail-brand";
import { buildMailShell, escapeHtml, mailLetterClosingHtml } from "@/lib/mail-layout";
import { getPublicAppUrl } from "@/lib/mail-enterprise";
import { toCloudinaryRef, uploadEnterpriseLicenseBytesToCloudinary, uploadEnterpriseLogoBytesToCloudinary } from "@/lib/storage/cloudinary";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const body = (await request.json()) as EnterpriseRegisterPayload;
  const validated = await validateEnterpriseRegisterPayload(body);
  if (!validated.ok) {
    const { error } = validated;
    return NextResponse.json(
      { success: false, field: error.field, message: error.message },
      { status: error.status }
    );
  }

  const { userCreate } = validated;
  const email = userCreate.email as string;
  const enterpriseMeta =
    userCreate.enterpriseMeta && typeof userCreate.enterpriseMeta === "object" && !Array.isArray(userCreate.enterpriseMeta)
      ? ({ ...(userCreate.enterpriseMeta as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const businessLicenseName = String(enterpriseMeta.businessLicenseName || "").trim();
  const businessLicenseMime = String(enterpriseMeta.businessLicenseMime || "").trim();
  const businessLicenseBase64 = String(enterpriseMeta.businessLicenseBase64 || "").trim();
  const companyLogoName = String(enterpriseMeta.companyLogoName || "").trim();
  const companyLogoMime = String(enterpriseMeta.companyLogoMime || "").trim();
  const companyLogoBase64 = String(enterpriseMeta.companyLogoBase64 || "").trim();

  if (businessLicenseBase64 && businessLicenseName && businessLicenseMime) {
    const uploadedLicense = await uploadEnterpriseLicenseBytesToCloudinary({
      bytes: Buffer.from(businessLicenseBase64, "base64"),
      mimeType: businessLicenseMime,
      ownerKey: String(userCreate.taxCode || email || "enterprise"),
      originalName: businessLicenseName
    });
    enterpriseMeta.businessLicensePublicId = toCloudinaryRef(uploadedLicense.publicId);
    delete enterpriseMeta.businessLicenseBase64;
    delete enterpriseMeta.businessLicenseByteLength;
  }

  if (companyLogoBase64 && companyLogoName && companyLogoMime) {
    const uploadedLogo = await uploadEnterpriseLogoBytesToCloudinary({
      bytes: Buffer.from(companyLogoBase64, "base64"),
      mimeType: companyLogoMime,
      ownerKey: String(userCreate.taxCode || email || "enterprise"),
      originalName: companyLogoName
    });
    enterpriseMeta.companyLogoPublicId = toCloudinaryRef(uploadedLogo.publicId);
    delete enterpriseMeta.companyLogoBase64;
    delete enterpriseMeta.companyLogoByteLength;
  }

  const nextUserCreate: Prisma.UserCreateInput = {
    ...userCreate,
    enterpriseMeta: enterpriseMeta as Prisma.InputJsonValue
  };

  try {
    await prisma.user.create({ data: nextUserCreate });
  } catch (e) {
    console.error("register-enterprise create user", e);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể tạo tài khoản (có thể email hoặc thông tin đã được dùng). Vui lòng thử lại."
      },
      { status: 409 }
    );
  }

  const appUrl = getPublicAppUrl();
  const name = (userCreate.fullName as string) || email;
  const subject = `${MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX} - Tiếp nhận đăng ký doanh nghiệp`;
  const loginUrl = `${appUrl}/auth/dangnhap`;
  const text = [
    `Kính gửi ${name},`,
    "",
    "Hệ thống đã tiếp nhận hồ sơ đăng ký doanh nghiệp của Quý đơn vị.",
    "Quý đơn vị sẽ nhận thông báo khi hồ sơ được phê duyệt.",
    "",
    `Đường dẫn hệ thống: ${loginUrl}`,
    "",
    "Nếu không phải Quý đơn vị thực hiện, vui lòng liên hệ quản trị hệ thống.",
    "",
    MAIL_TRANSACTIONAL_SIGN_OFF
  ].join("\n");

  const C = MAIL_BRAND;
  const html = buildMailShell({
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:${C.headerTitle};">Kính gửi <strong>${escapeHtml(name)}</strong>,</p>
      <p style="margin:0 0 20px;font-size:13px;color:${C.muted};line-height:1.55;">
        ${escapeHtml(MAIL_PRODUCT_NAME)} — ${escapeHtml(SCHOOL_FULL_NAME)}
      </p>
      <p style="margin:0 0 14px;color:${C.contentText};">Phòng Đào tạo trân trọng thông báo: hồ sơ đăng ký tài khoản doanh nghiệp của Quý đơn vị đã được hệ thống <strong style="color:${C.headerKicker};">tiếp nhận</strong> và đang chờ xét duyệt.</p>
      <p style="margin:0 0 14px;color:${C.contentText};">Sau khi hồ sơ được phê duyệt, Quý đơn vị sẽ nhận email thông báo và có thể đăng nhập theo đường dẫn dưới đây.</p>
      <p style="margin:0 0 16px;color:${C.contentText};"><strong style="color:${C.headerTitle};">Đường dẫn đăng nhập</strong><br/>
        <a href="${escapeHtml(loginUrl)}" style="color:${C.link};font-weight:600;text-decoration:underline;word-break:break-all;">${escapeHtml(loginUrl)}</a>
      </p>
      <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.6;">Trường hợp Quý đơn vị không thực hiện đăng ký, vui lòng bỏ qua thư này hoặc liên hệ quản trị hệ thống.</p>
      ${mailLetterClosingHtml()}
    `.trim()
  });

  try {
    await sendMail(email, subject, text, html);
  } catch (e) {
    console.error("register-enterprise notification mail", e);
  }

  return NextResponse.json({
    success: true,
    message: "Đăng ký thành công. Tài khoản đang chờ phê duyệt.",
    redirectPath: "/auth/dangky"
  });
}
