import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { GIANGVIEN_BAO_CAO_EXPORT_HEADER, degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import {
  fetchGiangVienBaoCaoListItems,
  resolveGiangVienSupervisorProfileId
} from "@/lib/server/giangvien-bao-cao-thuc-tap-list";

const MAX_EXPORT = 8000;

function fmtPoint(v: unknown): string {
  if (v == null) return "";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return "";
  return String(n);
}

function reviewLabel(s: string | null | undefined): string {
  if (!s) return "";
  if (s === "APPROVED") return "Đã duyệt";
  if (s === "REJECTED") return "Từ chối";
  return "Chờ duyệt";
}

function submittedDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const gv = await resolveGiangVienSupervisorProfileId();
  if (!gv.ok) return gv.response;

  try {
    const { searchParams } = new URL(request.url);
    const items = await fetchGiangVienBaoCaoListItems(gv.supervisorProfileId, searchParams);
    if (items.length > MAX_EXPORT) {
      return NextResponse.json(
        { success: false, message: `Kết quả vượt ${MAX_EXPORT} bản ghi. Vui lòng thu hẹp bộ lọc.` },
        { status: 400 }
      );
    }

    const degreeLookup = degreeLabel as Record<string, string>;

    const dataRows = items.map((row: any) => {
      const rep = row.report;
      const ent = row.enterprise;
      return [
        String(row.msv ?? ""),
        String(row.fullName ?? ""),
        String(row.className ?? ""),
        String(row.faculty ?? ""),
        String(row.cohort ?? ""),
        degreeLookup[String(row.degree ?? "")] ?? String(row.degree ?? ""),
        String(row.phone ?? ""),
        String(row.email ?? ""),
        String(row.statusText ?? ""),
        String(ent?.companyName ?? ""),
        String(ent?.headquartersAddress ?? ""),
        reviewLabel(rep?.reviewStatus),
        submittedDate(rep?.submittedAt),
        fmtPoint(rep?.supervisorPoint),
        fmtPoint(rep?.enterprisePoint),
        String(rep?.reportFileName ?? ""),
        String(rep?.supervisorEvaluation ?? "")
      ];
    });

    const aoa = [[...GIANGVIEN_BAO_CAO_EXPORT_HEADER], ...dataRows];
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
      { wch: 22 },
      { wch: 26 },
      { wch: 36 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao cao TT");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const disposition = `attachment; filename="bao_cao_thuc_tap.xlsx"; filename*=UTF-8''${encodeURIComponent("bao_cao_thuc_tap_theo_loc.xlsx")}`;

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": disposition
      }
    });
  } catch (e) {
    console.error("[GET /api/giangvien/bao-cao-thuc-tap/export]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}
