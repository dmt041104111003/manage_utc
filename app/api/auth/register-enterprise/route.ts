import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { validateEnterpriseRegisterPayload, type EnterpriseRegisterPayload } from "@/lib/enterprise-register-validate";
import { SCHOOL_NAME } from "@/lib/constants/school";
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
  const subject = `${SCHOOL_NAME} - Tiếp nhận đăng ký doanh nghiệp`;
  const text = [
    `Kính gửi ${name},`,
    "",
    "Hệ thống đã tiếp nhận hồ sơ đăng ký doanh nghiệp của bạn.",
    "Bạn sẽ nhận thông báo khi hồ sơ được phê duyệt.",
    "",
    `Đường dẫn hệ thống: ${appUrl}/auth/dangnhap`,
    "",
    "Nếu không phải bạn thực hiện, vui lòng liên hệ quản trị hệ thống."
  ].join("\n");

  try {
    await sendMail(email, subject, text);
  } catch (e) {
    console.error("register-enterprise notification mail", e);
  }

  return NextResponse.json({
    success: true,
    message: "Đăng ký thành công. Tài khoản đang chờ phê duyệt.",
    redirectPath: "/auth/dangky"
  });
}
