import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

function enterpriseMetaAsRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const batchId = searchParams.get("batchId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "all";
    const expertise = searchParams.get("expertise")?.trim() || "";

    const now = new Date();
    // Auto-stop khi quá hạn.
    try {
      await (prisma as any).jobPost.updateMany({
        where: {
          deadlineAt: { lt: now },
          status: { in: ["PENDING", "REJECTED", "ACTIVE"] }
        },
        data: { status: "STOPPED", stoppedAt: now }
      });
    } catch {
      // Không để lỗi auto-stop chặn tải danh sách
    }

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { enterpriseUser: { companyName: { contains: q, mode: "insensitive" } } }
      ];
    }
    if (batchId && batchId !== "all") where.internshipBatchId = batchId;
    if (status && status !== "all") where.status = status;
    if (expertise && expertise !== "all") where.expertise = { contains: expertise, mode: "insensitive" };

    const rows = await (prisma as any).jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        enterpriseUser: { select: { companyName: true, taxCode: true } },
        internshipBatch: { select: { id: true, name: true } }
      }
    });

    // Distinct expertise values for the filter dropdown – tách riêng try/catch để không chặn list
    let expertises: string[] = [];
    try {
      const expertiseRows = await (prisma as any).jobPost.findMany({
        distinct: ["expertise"],
        select: { expertise: true },
        orderBy: { expertise: "asc" },
        where: { expertise: { not: null } }
      });
      expertises = expertiseRows
        .map((r: any) => r.expertise as string)
        .filter(Boolean);
    } catch {
      // Không để lỗi distinct chặn tải danh sách
    }

    return NextResponse.json({
      success: true,
      items: rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt?.toISOString?.() ?? null,
        recruitmentCount: r.recruitmentCount,
        expertise: r.expertise,
        workType: r.workType,
        status: r.status,
        deadlineAt: r.deadlineAt?.toISOString?.() ?? null,
        enterpriseName: r.enterpriseUser?.companyName ?? null,
        batchName: r.internshipBatch?.name ?? null,
        enterpriseTaxCode: r.enterpriseUser?.taxCode ?? null,
        rejectionReason: r.rejectionReason ?? null
      })),
      expertises
    });
  } catch (e) {
    console.error("[GET /api/admin/job-posts]", e);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
