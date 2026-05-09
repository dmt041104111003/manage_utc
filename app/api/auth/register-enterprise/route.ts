import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { validateEnterpriseRegisterPayload, type EnterpriseRegisterPayload } from "@/lib/enterprise-register-validate";
import { SCHOOL_NAME } from "@/lib/constants/school";

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

  try {
    await prisma.user.create({ data: userCreate });
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

  const name = (userCreate.fullName as string) || email;
  const subject = `${SCHOOL_NAME} - Tiếp nhận đăng ký doanh nghiệp`;
  const text = [
    `Kính gửi ${name},`,
    "",
    "Hệ thống đã tiếp nhận hồ sơ đăng ký doanh nghiệp của bạn.",
    "Bạn sẽ nhận thông báo khi hồ sơ được phê duyệt.",
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
    redirectPath: "/auth/dangky/cho-phe-duyet"
  });
}
