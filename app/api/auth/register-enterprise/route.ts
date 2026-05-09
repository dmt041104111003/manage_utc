import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { validateEnterpriseRegisterPayload, type EnterpriseRegisterPayload } from "@/lib/enterprise-register-validate";
import { MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX, MAIL_TRANSACTIONAL_SIGN_OFF } from "@/lib/constants/school";
import { MAIL_BRAND } from "@/lib/mail-brand";
import { buildMailShell, escapeHtml, mailLetterClosingHtml } from "@/lib/mail-layout";
import { getPublicAppUrl } from "@/lib/mail-enterprise";
import { toCloudinaryRef, uploadEnterpriseLogoBytesToCloudinary } from "@/lib/storage/cloudinary";
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

  delete enterpriseMeta.businessLicensePublicId;

  const companyLogoName = String(enterpriseMeta.companyLogoName || "").trim();
  const companyLogoMime = String(enterpriseMeta.companyLogoMime || "").trim();
  const companyLogoBase64 = String(enterpriseMeta.companyLogoBase64 || "").trim();

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
    title: "Thông báo tiếp nhận đăng ký tài khoản doanh nghiệp",
    bodyHtml: `
      <p style="margin:0 0 12px;">Kính gửi <strong>${escapeHtml(name)}</strong>,</p>
      <p style="margin:0 0 12px;">
        Phòng Đào tạo trân trọng thông báo hồ sơ đăng ký tài khoản doanh nghiệp của Quý đơn vị
        đã được hệ thống <strong>tiếp nhận</strong> và đang trong quá trình xét duyệt.
      </p>
      <p style="margin:0 0 12px;">
        Sau khi hồ sơ được phê duyệt, Quý đơn vị sẽ nhận thông báo và có thể truy cập hệ thống theo đường dẫn dưới đây:
      </p>
      <p style="margin:16px 0;">
        <a href="${escapeHtml(loginUrl)}"
           style="color:${C.link};font-weight:bold;text-decoration:underline;word-break:break-all;">
          ${escapeHtml(loginUrl)}
        </a>
      </p>
      <p style="margin:0;">
        Trường hợp Quý đơn vị không thực hiện đăng ký, vui lòng bỏ qua email này hoặc liên hệ để được hỗ trợ.
      </p>
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
