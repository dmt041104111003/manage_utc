import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { sendMail } from "@/lib/mail";
import { getPublicAppUrl } from "@/lib/mail-enterprise";

type AssignmentStatus = "GUIDING" | "COMPLETED";

function normalizeQ(s: string) {
  return s.trim();
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = normalizeQ(searchParams.get("q") || "");
  const faculty = (searchParams.get("faculty") || "all").trim();
  const status = (searchParams.get("status") || "all").trim() as AssignmentStatus | "all";

  const prismaAny = prisma as any;
  const where: any = {};
  const andParts: any[] = [];

  if (faculty !== "all") andParts.push({ faculty });
  if (status !== "all") andParts.push({ status });

  if (q) {
    andParts.push({
      OR: [
        { supervisorProfile: { user: { fullName: { contains: q, mode: "insensitive" } } } },
        { students: { some: { studentProfile: { msv: { contains: q, mode: "insensitive" } } } } },
        { students: { some: { studentProfile: { user: { fullName: { contains: q, mode: "insensitive" } } } } } }
      ]
    });
  }

  if (andParts.length) where.AND = andParts;

  const rows = await prismaAny.supervisorAssignment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      faculty: true,
      status: true,
      internshipBatch: { select: { id: true, name: true, semester: true, schoolYear: true, status: true } },
      supervisorProfile: {
        select: { id: true, degree: true, user: { select: { fullName: true } } }
      },
      students: {
        select: {
          studentProfile: {
            select: { id: true, msv: true, degree: true, user: { select: { fullName: true } } }
          }
        }
      }
    }
  });

  let faculties: string[] = [];
  try {
    const fRows = await prismaAny.supervisorProfile.findMany({ distinct: ["faculty"], select: { faculty: true } });
    faculties = fRows.map((r: any) => String(r.faculty)).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, "vi"));
  } catch {
    faculties = [];
  }

  return NextResponse.json({
    success: true,
    faculties,
    items: rows.map((r: any) => ({
      id: r.id,
      faculty: r.faculty,
      status: r.status as AssignmentStatus,
      batch: {
        id: r.internshipBatch?.id ?? null,
        name: r.internshipBatch?.name ?? null,
        semester: r.internshipBatch?.semester ?? null,
        schoolYear: r.internshipBatch?.schoolYear ?? null,
        status: r.internshipBatch?.status ?? null
      },
      supervisor: {
        id: r.supervisorProfile?.id ?? null,
        fullName: r.supervisorProfile?.user?.fullName ?? "",
        degree: r.supervisorProfile?.degree ?? null
      },
      students: (r.students || []).map((x: any) => ({
        id: x.studentProfile?.id ?? null,
        msv: x.studentProfile?.msv ?? "",
        fullName: x.studentProfile?.user?.fullName ?? "",
        degree: x.studentProfile?.degree ?? null
      }))
    }))
  });
}

type CreateBody = {
  faculty: string;
  internshipBatchId: string;
  supervisorProfileId: string;
  studentProfileIds: string[];
};

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const body = (await request.json()) as CreateBody;
  const faculty = (body.faculty || "").trim();
  const internshipBatchId = (body.internshipBatchId || "").trim();
  const supervisorProfileId = (body.supervisorProfileId || "").trim();
  const studentProfileIds = Array.isArray(body.studentProfileIds) ? body.studentProfileIds.filter(Boolean) : [];

  const errors: Record<string, string> = {};
  if (!faculty) errors.faculty = "Khoa bắt buộc.";
  if (!internshipBatchId) errors.internshipBatchId = "Đợt thực tập bắt buộc.";
  if (!supervisorProfileId) errors.supervisorProfileId = "GVHD bắt buộc.";
  if (!studentProfileIds.length) errors.studentProfileIds = "Danh sách sinh viên hướng dẫn bắt buộc.";
  if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

  const prismaAny = prisma as any;

  const batch = await prismaAny.internshipBatch.findUnique({ where: { id: internshipBatchId }, select: { id: true, status: true } });
  if (!batch || batch.status !== "OPEN") {
    return NextResponse.json({ success: false, message: "Đợt thực tập không hợp lệ hoặc không ở trạng thái đang mở." }, { status: 400 });
  }

  const supervisor = await prismaAny.supervisorProfile.findUnique({
    where: { id: supervisorProfileId },
    select: {
      id: true,
      faculty: true,
      degree: true,
      user: { select: { fullName: true, email: true, phone: true } }
    }
  });
  if (!supervisor || supervisor.faculty !== faculty) {
    return NextResponse.json({ success: false, message: "GVHD không hợp lệ hoặc không thuộc khoa đã chọn." }, { status: 400 });
  }

  const existingSupervisorInBatch = await prismaAny.supervisorAssignment.findFirst({
    where: { internshipBatchId, supervisorProfileId },
    select: { id: true }
  });
  if (existingSupervisorInBatch) {
    return NextResponse.json({ success: false, message: "GVHD đã được phân công trong đợt thực tập này." }, { status: 400 });
  }

  const students = await prismaAny.studentProfile.findMany({
    where: { id: { in: studentProfileIds } },
    select: {
      id: true,
      faculty: true,
      msv: true,
      className: true,
      degree: true,
      internshipStatus: true,
      user: { select: { fullName: true, email: true } }
    }
  });
  if (students.length !== studentProfileIds.length) {
    return NextResponse.json({ success: false, message: "Danh sách sinh viên không hợp lệ." }, { status: 400 });
  }
  for (const s of students) {
    if (s.faculty !== faculty) {
      return NextResponse.json({ success: false, message: "Có sinh viên không thuộc khoa đã chọn." }, { status: 400 });
    }
    if (s.internshipStatus !== "NOT_STARTED" && s.internshipStatus !== "DOING") {
      return NextResponse.json(
        { success: false, message: "Chỉ được chọn sinh viên có trạng thái Chưa thực tập hoặc Đang thực tập." },
        { status: 400 }
      );
    }
  }

  const existingStudentLinks = await prismaAny.supervisorAssignmentStudent.findMany({
    where: { studentProfileId: { in: studentProfileIds }, supervisorAssignment: { internshipBatchId } },
    select: { studentProfileId: true }
  });
  if (existingStudentLinks.length) {
    return NextResponse.json({ success: false, message: "Có sinh viên đã được phân công GVHD trong đợt thực tập đã chọn." }, { status: 400 });
  }

  const batchDetails = await prismaAny.internshipBatch.findUnique({
    where: { id: internshipBatchId },
    select: { name: true, semester: true, schoolYear: true }
  });

  await prismaAny.$transaction(
    async (tx: any) => {
      const assignment = await tx.supervisorAssignment.create({
        data: {
          faculty,
          status: "GUIDING",
          internshipBatchId,
          supervisorProfileId
        },
        select: { id: true }
      });

      await tx.supervisorAssignmentStatusHistory.create({
        data: {
          supervisorAssignmentId: assignment.id,
          fromStatus: "GUIDING",
          toStatus: "GUIDING",
          byRole: "admin",
          message: "Khởi tạo phân công GVHD"
        }
      });

      for (const sid of studentProfileIds) {
        await tx.supervisorAssignmentStudent.create({
          data: { supervisorAssignmentId: assignment.id, studentProfileId: sid }
        });
      }
    },
    { timeout: 30_000 }
  );

  // Send email notifications
  try {
    const appUrl = getPublicAppUrl();
    const supervisorDegreeLabelMap: Record<string, string> = {
      MASTER: "Thạc sĩ",
      PHD: "Tiến sĩ",
      ASSOC_PROF: "Phó giáo sư",
      PROF: "Giáo sư"
    };
    const degreeLabelMap: Record<string, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };
    const batchLabel = batchDetails
      ? `${batchDetails.name} (${batchDetails.semester} – ${batchDetails.schoolYear})`
      : "đợt thực tập";

    const gvFullName: string = supervisor.user?.fullName ?? "Giảng viên";
    const gvEmail: string | null = supervisor.user?.email ?? null;
    const gvDegree: string = supervisorDegreeLabelMap[supervisor.degree] ?? supervisor.degree ?? "";
    const gvPhone: string = supervisor.user?.phone ?? "—";
    const facultyLabel = faculty ? `\n  Ngành/Khoa: ${faculty}` : "";

    if (gvEmail) {
      const svListLines = students
        .map(
          (s: any, i: number) =>
            `${i + 1}. ${s.msv} – ${s.user?.fullName ?? ""} – ${degreeLabelMap[s.degree] ?? s.degree ?? ""} – Lớp: ${s.className ?? "—"}`
        )
        .join("\n");

      await sendMail(
        gvEmail,
        `[UTC] Phân công hướng dẫn thực tập – ${batchLabel}`,
        `Kính gửi ${gvDegree} ${gvFullName},\n\nBạn đã được phân công hướng dẫn thực tập cho ${students.length} sinh viên trong ${batchLabel}.${facultyLabel}\n\nDanh sách sinh viên hướng dẫn:\n${svListLines}\n\nVui lòng đăng nhập hệ thống để xem thông tin chi tiết và theo dõi tiến độ thực tập của sinh viên.\nĐường dẫn hệ thống: ${appUrl}/giangvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }

    for (const s of students as any[]) {
      const svEmail: string | null = s.user?.email ?? null;
      const svFullName: string = s.user?.fullName ?? "Sinh viên";
      if (!svEmail) continue;

      await sendMail(
        svEmail,
        `[UTC] Thông tin Giảng viên hướng dẫn thực tập – ${batchLabel}`,
        `Kính gửi ${svFullName},\n\nBạn đã được phân công Giảng viên hướng dẫn (GVHD) cho ${batchLabel}.${facultyLabel}\n\nThông tin GVHD:\n  Họ tên: ${gvDegree} ${gvFullName}\n  Email: ${gvEmail ?? "—"}\n  Số điện thoại: ${gvPhone}\n\nVui lòng liên hệ GVHD để được hướng dẫn trong quá trình thực tập.\nĐường dẫn hệ thống: ${appUrl}/sinhvien\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
      );
    }
  } catch {
  }

  return NextResponse.json({ success: true, message: "Tạo phân công thành công." });
}

