import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { AUTH_STRONG_PASSWORD_PATTERN } from "@/lib/constants/auth/patterns";

type ResetPayload = {
  email?: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPayload;
  const email = body.email?.trim().toLowerCase() || "";
  const token = body.token?.trim() || "";
  const newPassword = body.newPassword?.trim() || "";
  const confirmPassword = body.confirmPassword?.trim() || "";

  if (!email || !newPassword || !confirmPassword || !token) {
    return NextResponse.json(
      { success: false, code: "REQUIRED", message: "Vui lòng nhập đầy đủ thông tin hoặc mở lại liên kết từ email." },
      { status: 400 }
    );
  }

  let tokenEmail: string;
  try {
    ({ email: tokenEmail } = await verifyPasswordResetToken(token));
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_TOKEN", message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." },
      { status: 400 }
    );
  }

  if (tokenEmail !== email) {
    return NextResponse.json(
      { success: false, code: "INVALID_TOKEN", message: "Email không khớp với mã xác thực." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isLocked) {
    return NextResponse.json(
      { success: false, code: "INVALID_ACCOUNT", message: "Tài khoản không hợp lệ hoặc đã bị khóa." },
      { status: 400 }
    );
  }

  if (!AUTH_STRONG_PASSWORD_PATTERN.test(newPassword)) {
    return NextResponse.json(
      {
        success: false,
        code: "WEAK_PASSWORD",
        message: "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
      },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, code: "CONFIRM_NOT_MATCH", message: "Xác nhận mật khẩu mới không trùng khớp." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) }
  });

  return NextResponse.json({
    success: true,
    message: "Đặt lại mật khẩu thành công.",
    redirectPath: "/auth/dangnhap"
  });
}
