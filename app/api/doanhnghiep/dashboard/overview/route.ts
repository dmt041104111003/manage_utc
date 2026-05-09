import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

async function getEnterpriseUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "doanhnghiep") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    return { userId: verified.sub as string };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET() {
  const auth = await getEnterpriseUserId();
  if ("error" in auth) return auth.error;
  const enterpriseUserId = auth.userId;
  const prismaAny = prisma as any;

  const openPosts = await prismaAny.jobPost.count({
    where: {
      enterpriseUserId,
      status: "ACTIVE"
    }
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newApplications = await prismaAny.jobApplication.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
      jobPost: { enterpriseUserId }
    }
  });

  const acceptedApplications = await prismaAny.jobApplication.count({
    where: {
      response: "ACCEPTED",
      jobPost: { enterpriseUserId }
    }
  });

  const tasks: string[] = [];
  if (newApplications > 0) tasks.push(`Có ${newApplications} hồ sơ ứng tuyển mới trong 7 ngày qua.`);
  if (openPosts === 0) tasks.push("Hiện chưa có tin tuyển dụng đang mở.");
  if (acceptedApplications > 0) tasks.push(`Đang tiếp nhận ${acceptedApplications} sinh viên.`);
  tasks.push("Theo dõi và phản hồi hồ sơ ứng tuyển kịp thời.");
  if (tasks.length === 0) tasks.push("Hiện chưa có nhiệm vụ mới.");

  return NextResponse.json({
    success: true,
    item: {
      openPosts,
      newApplications,
      receivingStudents: acceptedApplications,
      tasks
    }
  });
}

