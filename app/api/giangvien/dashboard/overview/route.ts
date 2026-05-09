import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

async function getSupervisorProfileId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "giangvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    const prismaAny = prisma as any;
    const sup = await prismaAny.supervisorProfile.findFirst({ where: { userId: verified.sub }, select: { id: true } });
    if (!sup) {
      return { error: NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ giảng viên." }, { status: 404 }) };
    }
    return { supervisorProfileId: sup.id as string };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET() {
  const auth = await getSupervisorProfileId();
  if ("error" in auth) return auth.error;
  const supervisorProfileId = auth.supervisorProfileId;
  const prismaAny = prisma as any;

  const links: Array<{ studentProfileId: string }> = await prismaAny.supervisorAssignmentStudent.findMany({
    where: {
      supervisorAssignment: { supervisorProfileId }
    },
    select: { studentProfileId: true }
  });
  const studentProfileIds = Array.from(new Set(links.map((x) => String(x.studentProfileId))));

  if (studentProfileIds.length === 0) {
    return NextResponse.json({
      success: true,
      item: {
        assignedStudents: 0,
        pendingReports: 0,
        weeklyReviews: 0,
        tasks: ["Chưa có sinh viên được phân công."]
      }
    });
  }

  const pendingReports = await prismaAny.internshipReport.count({
    where: {
      studentProfileId: { in: studentProfileIds },
      reviewStatus: "PENDING"
    }
  });

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const diffToMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diffToMonday);

  const weeklySubmitted = await prismaAny.internshipReport.count({
    where: {
      studentProfileId: { in: studentProfileIds },
      submittedAt: { gte: weekStart }
    }
  });

  const tasks: string[] = [];
  if (pendingReports > 0) tasks.push(`Có ${pendingReports} báo cáo đang chờ duyệt.`);
  if (weeklySubmitted > 0) tasks.push(`Tuần này có ${weeklySubmitted} báo cáo mới được nộp.`);
  tasks.push("Theo dõi tiến độ thực tập của sinh viên phụ trách.");
  if (tasks.length === 0) tasks.push("Hiện chưa có việc cần xử lý.");

  return NextResponse.json({
    success: true,
    item: {
      assignedStudents: studentProfileIds.length,
      pendingReports,
      weeklyReviews: weeklySubmitted,
      tasks
    }
  });
}

