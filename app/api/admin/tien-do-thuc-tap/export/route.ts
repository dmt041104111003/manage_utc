import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { ADMIN_TIEN_DO_FILTER_EXPORT_HEADER } from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";
import { ADMIN_QUAN_LY_SINH_VIEN_DEGREE_LABEL } from "@/lib/constants/admin-quan-ly-sinh-vien";
import { buildAdminTienDoListWhere } from "@/lib/server/admin-tien-do-list-filter";
import { getAdminTienDoStatusLabel } from "@/lib/utils/admin-tien-do-status-label";
import type { InternshipStatus } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";

const MAX_EXPORT = 8000;

function fmtPoint(v: unknown): string {
  if (v == null) return "";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return "";
  return String(n);
}

function reportReviewLabel(s: string | null | undefined): string {
  if (!s) return "";
  if (s === "APPROVED") return "Đã duyệt";
  if (s === "REJECTED") return "Từ chối";
  if (s === "PENDING") return "Chờ duyệt";
  return String(s);
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const prismaAny = prisma as any;
    const where = buildAdminTienDoListWhere(searchParams) as any;

    const totalItems = await prismaAny.studentProfile.count({ where });
    if (totalItems > MAX_EXPORT) {
      return NextResponse.json(
        { message: `Kết quả vượt ${MAX_EXPORT} sinh viên. Vui lòng thu hẹp bộ lọc hoặc từ khóa tìm kiếm.` },
        { status: 400 }
      );
    }

    const rows = await prismaAny.studentProfile.findMany({
      where,
      orderBy: { msv: "asc" },
      take: MAX_EXPORT,
      select: {
        id: true,
        userId: true,
        msv: true,
        className: true,
        faculty: true,
        cohort: true,
        degree: true,
        internshipStatus: true,
        user: { select: { fullName: true, phone: true, email: true } },
        internshipReport: {
          select: { reviewStatus: true, supervisorPoint: true, enterprisePoint: true }
        },
        assignmentLinks: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            supervisorAssignment: {
              select: {
                supervisorProfile: {
                  select: { user: { select: { fullName: true, email: true, phone: true } } }
                }
              }
            }
          }
        }
      }
    });

    const userIds = [...new Set(rows.map((r: { userId: string }) => String(r.userId)).filter(Boolean))];
    const enterpriseByUserId = new Map<string, { companyName: string; position: string }>();

    if (userIds.length) {
      const apps = await prismaAny.jobApplication.findMany({
        where: { studentUserId: { in: userIds }, status: "OFFERED", response: "ACCEPTED" },
        orderBy: { createdAt: "desc" },
        select: {
          studentUserId: true,
          jobPost: {
            select: {
              title: true,
              enterpriseUser: { select: { companyName: true } }
            }
          }
        }
      });
      for (const a of apps) {
        const uid = String(a.studentUserId);
        if (enterpriseByUserId.has(uid)) continue;
        enterpriseByUserId.set(uid, {
          companyName: String(a.jobPost?.enterpriseUser?.companyName ?? ""),
          position: String(a.jobPost?.title ?? "")
        });
      }
    }

    const degreeMap = ADMIN_QUAN_LY_SINH_VIEN_DEGREE_LABEL as Record<string, string>;

    const dataRows = rows.map((r: any) => {
      const internshipStatus = r.internshipStatus as InternshipStatus;
      const reportReviewStatus = r.internshipReport?.reviewStatus ?? null;
      const statusLabel = getAdminTienDoStatusLabel(internshipStatus, reportReviewStatus);
      const sup = r.assignmentLinks?.[0]?.supervisorAssignment?.supervisorProfile?.user;

      let companyName = "";
      let position = "";
      if (internshipStatus !== "SELF_FINANCED") {
        const ent = enterpriseByUserId.get(String(r.userId));
        if (ent) {
          companyName = ent.companyName;
          position = ent.position;
        }
      }

      return [
        String(r.msv ?? ""),
        String(r.user?.fullName ?? ""),
        String(r.className ?? ""),
        String(r.faculty ?? ""),
        String(r.cohort ?? ""),
        degreeMap[String(r.degree ?? "")] ?? String(r.degree ?? ""),
        String(r.user?.phone ?? ""),
        String(r.user?.email ?? ""),
        statusLabel,
        String(sup?.fullName ?? ""),
        String(sup?.email ?? ""),
        String(sup?.phone ?? ""),
        companyName,
        position,
        reportReviewLabel(reportReviewStatus),
        fmtPoint(r.internshipReport?.supervisorPoint),
        fmtPoint(r.internshipReport?.enterprisePoint)
      ];
    });

    const aoa = [[...ADMIN_TIEN_DO_FILTER_EXPORT_HEADER], ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) continue;
        cell.t = "s";
        cell.v = String(cell.v ?? "");
      }
    }

    ws["!cols"] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 10 },
      { wch: 22 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 26 },
      { wch: 28 },
      { wch: 22 },
      { wch: 26 },
      { wch: 14 },
      { wch: 28 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tien do TT");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const disposition = `attachment; filename="tien_do_thuc_tap.xlsx"; filename*=UTF-8''${encodeURIComponent("tien_do_thuc_tap_theo_loc.xlsx")}`;

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": disposition
      }
    });
  } catch (e) {
    console.error("[GET /api/admin/tien-do-thuc-tap/export]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}
