import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type InternshipBatchStatus = "OPEN" | "CLOSED";
type Semester = "HK_I" | "HK_II" | "HK_HE" | "HK_PHU";

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(input: string | null | undefined) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const start = new Date(`${trimmed}T00:00:00.000Z`);
  const end = new Date(`${trimmed}T23:59:59.999Z`);
  return { start, end, asStart: start };
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const startDateStr = searchParams.get("startDate") || "";
    const endDateStr = searchParams.get("endDate") || "";
    const status = (searchParams.get("status") || "all").trim() as InternshipBatchStatus | "all";

    const today = getTodayStart();

    // Auto-close quá hạn.
    try {
      await (prisma as any).internshipBatch.updateMany({
        where: { endDate: { lt: today }, status: "OPEN" },
        data: { status: "CLOSED" }
      });
    } catch (e) {
      console.error("[GET /api/admin/internship-batches] auto-close error", e);
    }

    const dateStart = parseDateOnly(startDateStr);
    const dateEnd = parseDateOnly(endDateStr);

    const where: any = {};
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (status !== "all") where.status = status;
    if (dateStart) where.startDate = { gte: dateStart.start, lte: dateStart.end };
    if (dateEnd) where.endDate = { gte: dateEnd.start, lte: dateEnd.end };

    const prismaAny = prisma as any;

    const [rows, openCount, closedCount] = await Promise.all([
      prismaAny.internshipBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          semester: true,
          schoolYear: true,
          startDate: true,
          endDate: true,
          status: true,
          notes: true
        }
      }),
      prismaAny.internshipBatch.count({ where: { status: "OPEN" } }),
      prismaAny.internshipBatch.count({ where: { status: "CLOSED" } })
    ]);

    return NextResponse.json({
      success: true,
      batchStatusStats: { open: openCount ?? 0, closed: closedCount ?? 0 },
      items: rows.map((r: any) => ({
        ...r,
        startDate: r.startDate?.toISOString?.() ?? null,
        endDate: r.endDate?.toISOString?.() ?? null
      }))
    });
  } catch (e) {
    console.error("[GET /api/admin/internship-batches]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const body = (await request.json()) as {
    name?: string;
    semester?: Semester;
    schoolYear?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    notes?: string;
  };

  const name = (body.name || "").trim();
  const semester = body.semester;
  const schoolYear = (body.schoolYear || "").trim();
  const notes = (body.notes || "").trim();

  const today = getTodayStart();
  const startDateStr = (body.startDate || today.toISOString().slice(0, 10)).trim();
  const endDateStr = (body.endDate || "").trim();

  const startParsed = parseDateOnly(startDateStr);
  const endParsed = parseDateOnly(endDateStr);

  const errors: Record<string, string> = {};
  if (!name || name.length < 1 || name.length > 255) errors.name = "Tên đợt thực tập từ 1–255 ký tự.";
  if (!semester || !["HK_I", "HK_II", "HK_HE", "HK_PHU"].includes(String(semester))) errors.semester = "Học kỳ không hợp lệ.";
  if (!/^\d{4}-\d{4}$/.test(schoolYear) || schoolYear.length < 8 || schoolYear.length > 15)
    errors.schoolYear = "Năm học chỉ cho phép số, dấu '-' (ví dụ 2024-2025).";
  if (!startParsed) errors.startDate = "Thời gian bắt đầu không hợp lệ (YYYY-MM-DD).";
  if (!endParsed) errors.endDate = "Thời gian kết thúc không hợp lệ (YYYY-MM-DD).";
  if (startParsed && endParsed) {
    if (endParsed.asStart.getTime() <= startParsed.asStart.getTime()) errors.endDate = "Thời gian kết thúc phải > thời gian bắt đầu.";
    if (endParsed.asStart.getTime() <= today.getTime()) errors.endDate = "Thời gian kết thúc phải > ngày hiện tại.";
  }
  if (!notes) errors.notes = "Ghi chú bắt buộc.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  const startDate = startParsed!.asStart;
  const endDate = endParsed!.asStart;

  // Trùng kỳ-năm hoặc trùng start-end.
  const existsSemester = await (prisma as any).internshipBatch.findFirst({
    where: { semester, schoolYear }
  });
  if (existsSemester) {
    return NextResponse.json({ success: false, message: "Thông tin đợt thực tập đã tồn tại (trùng kỳ-năm)." }, { status: 409 });
  }
  const existsDates = await (prisma as any).internshipBatch.findFirst({
    where: { startDate, endDate }
  });
  if (existsDates) {
    return NextResponse.json({ success: false, message: "Thông tin đợt thực tập đã tồn tại (trùng ngày bắt đầu-kết thúc)." }, { status: 409 });
  }

  await (prisma as any).internshipBatch.create({
    data: {
      name,
      semester,
      schoolYear,
      startDate,
      endDate,
      notes,
      status: "OPEN"
    }
  });

  return NextResponse.json({ success: true, message: "Tạo đợt thực tập thành công." });
}

