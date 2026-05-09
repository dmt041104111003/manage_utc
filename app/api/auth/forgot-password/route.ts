import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { signPasswordResetToken } from "@/lib/auth/jwt";
import { AUTH_EMAIL_SIMPLE_PATTERN } from "@/lib/constants/auth/patterns";
import { SCHOOL_FULL_NAME } from "@/lib/constants/school";
import { getPublicAppUrl } from "@/lib/mail-enterprise";

type ForgotPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ForgotPayload;
  const email = body.email?.trim().toLowerCase() || "";

  if (!email) {
    return NextResponse.json({ success: false, code: "EMPTY_EMAIL", message: "Vui lòng nhập email." }, { status: 400 });
  }

  if (!AUTH_EMAIL_SIMPLE_PATTERN.test(email)) {
    return NextResponse.json(
      { success: false, code: "INVALID_FORMAT", message: "Email không đúng định dạng example@domain.com." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { success: false, code: "NOT_FOUND", message: "Email không tồn tại trong hệ thống." },
      { status: 404 }
    );
  }

  if (user.isLocked) {
    return NextResponse.json(
      { success: false, code: "LOCKED", message: "Email thuộc tài khoản bị khóa." },
      { status: 423 }
    );
  }

  if (user.role === "admin") {
    return NextResponse.json(
      {
        success: false,
        code: "NOT_ALLOWED",
        message: "Tài khoản quản trị không hỗ trợ đặt lại mật khẩu qua email. Vui lòng liên hệ bộ phận kỹ thuật."
      },
      { status: 403 }
    );
  }

  let resetToken: string;
  try {
    resetToken = await signPasswordResetToken(email);
  } catch (e) {
    console.error("forgot-password sign token", e);
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", message: "Không thể tạo liên kết đặt lại mật khẩu. Thử lại sau." },
      { status: 500 }
    );
  }

  const appUrl = getPublicAppUrl();
  const qs = new URLSearchParams({ email, token: resetToken });
  const resetPath = `/auth/datlaimatkhau?${qs.toString()}`;
  const resetUrl = `${appUrl}${resetPath}`;

  const subject = `${SCHOOL_FULL_NAME} - Đặt lại mật khẩu`;
  const text = [
    `Kính gửi ${user.fullName},`,
    "",
    `Bạn vừa yêu cầu đặt lại mật khẩu trên hệ thống ${SCHOOL_FULL_NAME}.`,
    "",
    `Mở liên kết sau để đặt mật khẩu mới (hiệu lực 15 phút):`,
    resetUrl,
    "",
    "Nếu không phải bạn, bỏ qua email này."
  ].join("\n");

  try {
    await sendMail(email, subject, text);
  } catch (e) {
    console.error("sendMail forgot-password", e);
    return NextResponse.json(
      { success: false, code: "MAIL_FAILED", message: "Không gửi được email. Kiểm tra cấu hình SMTP hoặc thử lại sau." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hòm thư."
  });
}
