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
  const asStart = new Date(`${trimmed}T00:00:00.000Z`);
  const end = new Date(`${trimmed}T23:59:59.999Z`);
  return { asStart, start: asStart, end };
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const row = await (prisma as any).internshipBatch.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      semester: true,
      schoolYear: true,
      startDate: true,
      endDate: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!row) return NextResponse.json({ message: "Không tìm thấy đợt thực tập." }, { status: 404 });

  return NextResponse.json({
    success: true,
    item: {
      ...row,
      startDate: row.startDate?.toISOString?.() ?? null,
      endDate: row.endDate?.toISOString?.() ?? null,
      createdAt: row.createdAt?.toISOString?.() ?? null,
      updatedAt: row.updatedAt?.toISOString?.() ?? null
    }
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
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

  const startParsed = parseDateOnly(body.startDate || "");
  const endParsed = parseDateOnly(body.endDate || "");
  const today = getTodayStart();

  const errors: Record<string, string> = {};
  if (!name || name.length < 1 || name.length > 255) errors.name = "Tên đợt thực tập từ 1–255 ký tự.";
  if (!semester || !["HK_I", "HK_II", "HK_HE", "HK_PHU"].includes(String(semester))) errors.semester = "Học kỳ không hợp lệ.";
  if (!/^\d{4}-\d{4}$/.test(schoolYear) || schoolYear.length < 8 || schoolYear.length > 15)
    errors.schoolYear = "Năm học chỉ cho phép số, dấu '-' (ví dụ 2024-2025).";
  if (!startParsed) errors.startDate = "Thời gian bắt đầu không hợp lệ (YYYY-MM-DD).";
  if (!endParsed) errors.endDate = "Thời gian kết thúc không hợp lệ (YYYY-MM-DD).";
  if (startParsed && endParsed) {
    if (endParsed.asStart.getTime() <= startParsed.asStart.getTime()) errors.endDate = "Thời gian kết thúc phải > thời gian bắt đầu.";
  }
  if (!notes) errors.notes = "Ghi chú bắt buộc.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  const startDate = startParsed!.asStart;
  const endDate = endParsed!.asStart;

  const current = await (prisma as any).internshipBatch.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: "Không tìm thấy đợt thực tập." }, { status: 404 });

  const endChanged = new Date(current.endDate).toISOString().slice(0, 10) !== body.endDate;

  // Trùng kỳ-năm (loại chính nó)
  const existsSemester = await (prisma as any).internshipBatch.findFirst({
    where: { semester, schoolYear, NOT: { id } }
  });
  if (existsSemester) {
    return NextResponse.json({ success: false, message: "Thông tin đợt thực tập đã tồn tại (trùng kỳ-năm)." }, { status: 409 });
  }

  const existsDates = await (prisma as any).internshipBatch.findFirst({
    where: { startDate, endDate, NOT: { id } }
  });
  if (existsDates) {
    return NextResponse.json({ success: false, message: "Thông tin đợt thực tập đã tồn tại (trùng ngày bắt đầu-kết thúc)." }, { status: 409 });
  }

  // Quy tắc trạng thái:
  // - Nếu endDate <= hôm nay => Đóng
  // - Nếu endDate > hôm nay và admin sửa ngày kết thúc => Đang mở
  // - Nếu endDate > hôm nay nhưng không đổi endDate => giữ nguyên trạng thái hiện tại (để hỗ trợ đóng sớm)
  let nextStatus: InternshipBatchStatus = current.status;
  if (endDate.getTime() <= today.getTime()) nextStatus = "CLOSED";
  else if (endChanged) nextStatus = "OPEN";

  await (prisma as any).internshipBatch.update({
    where: { id },
    data: { name, semester, schoolYear, startDate, endDate, notes, status: nextStatus }
  });

  return NextResponse.json({ success: true, message: "Cập nhật đợt thực tập thành công." });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;

  const current = await (prisma as any).internshipBatch.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!current) return NextResponse.json({ message: "Không tìm thấy đợt thực tập." }, { status: 404 });

  const linkedCount = await (prisma as any).jobPost.count({
    where: { internshipBatchId: id }
  });

  if (linkedCount > 0) {
    return NextResponse.json(
      { success: false, message: "Không thể xóa Đợt thực tập đã có dữ liệu liên kết trong hệ thống." },
      { status: 409 }
    );
  }

  await (prisma as any).internshipBatch.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Xóa đợt thực tập thành công." });
}

