import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/jwt";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { AUTH_STRONG_PASSWORD_PATTERN, SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";

type ChangePasswordPayload = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." }, { status: 401 });
  }

  let sub: string;
  try {
    ({ sub } = await verifySession(sessionCookie));
  } catch {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Phiên đăng nhập không hợp lệ." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ChangePasswordPayload;
  const currentPassword = body.currentPassword?.trim() || "";
  const newPassword = body.newPassword?.trim() || "";
  const confirmPassword = body.confirmPassword?.trim() || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { success: false, code: "REQUIRED", message: "Vui lòng nhập đầy đủ thông tin bắt buộc." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED", message: "Tài khoản không tồn tại." }, { status: 401 });
  }

  const currentOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.json(
      { success: false, code: "WRONG_CURRENT", message: "Mật khẩu hiện tại không chính xác." },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { success: false, code: "SAME_AS_CURRENT", message: "Mật khẩu mới không được trùng với mật khẩu hiện tại." },
      { status: 400 }
    );
  }

  if (!AUTH_STRONG_PASSWORD_PATTERN.test(newPassword)) {
    return NextResponse.json(
      {
        success: false,
        code: "WEAK_PASSWORD",
        message: "Mật khẩu phải có ít nhất 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
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
    message: "Đổi mật khẩu thành công."
  });
}
