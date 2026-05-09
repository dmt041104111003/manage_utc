import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE } from "@/lib/constants/admin-quan-ly-tai-khoan";

type AccountStatus = "ACTIVE" | "STOPPED";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const roleParam = searchParams.get("role")?.trim() || "all";
    const statusParam = (searchParams.get("status")?.trim() || "all") as AccountStatus | "all";
    const page = Math.max(Number(searchParams.get("page") || "1") || 1, 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || String(ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE)) || ADMIN_QUAN_LY_TAI_KHOAN_PAGE_SIZE, 1);

    const where: Prisma.UserWhereInput = {
      role: { in: [Role.sinhvien, Role.giangvien, Role.doanhnghiep] }
    };
    const andParts: Prisma.UserWhereInput[] = [];

    if (q) {
      const isNumeric = /^\d+$/.test(q);
      const isEmailLike = q.includes("@") || q.includes(".");
      andParts.push({
        OR: [
          ...(q.length >= 2 ? [{ fullName: { contains: q, mode: "insensitive" } }] : []),
          ...(isNumeric ? [{ phone: { startsWith: q } }, { taxCode: { startsWith: q } }] : []),
          ...(isEmailLike ? [{ email: { startsWith: q, mode: "insensitive" } }] : []),
          ...(q.length >= 2 ? [{ companyName: { contains: q, mode: "insensitive" } }] : [])
        ]
      });
    }

    if (roleParam !== "all" && Object.values(Role).includes(roleParam as Role)) {
      const r = roleParam as Role;
      if (([Role.sinhvien, Role.giangvien, Role.doanhnghiep] as Role[]).includes(r)) andParts.push({ role: r });
    }

    if (statusParam !== "all") {
      andParts.push({ isLocked: statusParam === "STOPPED" });
    }

    if (andParts.length) where.AND = andParts;

    const totalItems = await prisma.user.count({ where });
    const rows = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isLocked: true,
        companyName: true
      }
    });

    // --- Latest batch account stats ---
    let latestBatchAccountStats: {
      batchId: string | null;
      batchName: string | null;
      active: number;
      stopped: number;
    } = { batchId: null, batchName: null, active: 0, stopped: 0 };

    try {
      const prismaAny = prisma as any;
      const latestBatch: { id: string; name: string } | null = await prismaAny.internshipBatch.findFirst({
        orderBy: { startDate: "desc" },
        select: { id: true, name: true }
      });

      if (latestBatch?.id) {
        const batchId = String(latestBatch.id);

        // Accounts related to the latest batch:
        // - lecturers having supervisor assignments in batch
        // - students assigned to those assignments in batch
        // - enterprises posting jobs in batch
        const [assignmentRows, studentLinkRows, enterpriseJobRows] = await Promise.all([
          prismaAny.supervisorAssignment.findMany({
            where: { internshipBatchId: batchId },
            select: { supervisorProfile: { select: { userId: true } } }
          }) as Promise<Array<{ supervisorProfile: { userId: string } | null }>>,
          prismaAny.supervisorAssignmentStudent.findMany({
            where: { supervisorAssignment: { internshipBatchId: batchId } },
            select: { studentProfile: { select: { userId: true } } }
          }) as Promise<Array<{ studentProfile: { userId: string } | null }>>,
          prismaAny.jobPost.findMany({
            where: { internshipBatchId: batchId },
            select: { enterpriseUserId: true }
          }) as Promise<Array<{ enterpriseUserId: string }>>
        ]);

        const userIds = new Set<string>();
        for (const a of assignmentRows) {
          const id = a.supervisorProfile?.userId;
          if (id) userIds.add(String(id));
        }
        for (const l of studentLinkRows) {
          const id = l.studentProfile?.userId;
          if (id) userIds.add(String(id));
        }
        for (const jp of enterpriseJobRows) {
          if (jp.enterpriseUserId) userIds.add(String(jp.enterpriseUserId));
        }

        if (userIds.size) {
          const list = Array.from(userIds);
          const [active, stopped] = await Promise.all([
            prismaAny.user.count({ where: { id: { in: list }, isLocked: false } }),
            prismaAny.user.count({ where: { id: { in: list }, isLocked: true } })
          ]);
          latestBatchAccountStats = {
            batchId,
            batchName: latestBatch.name ?? null,
            active,
            stopped
          };
        } else {
          latestBatchAccountStats = {
            batchId,
            batchName: latestBatch.name ?? null,
            active: 0,
            stopped: 0
          };
        }
      }
    } catch (e) {
      console.error("[GET /api/admin/accounts] latestBatchAccountStats error", e);
    }

    return NextResponse.json({
      success: true,
      latestBatchAccountStats,
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.role === Role.doanhnghiep ? r.companyName || r.fullName : r.fullName,
        email: r.email,
        phone: r.phone ?? null,
        role: r.role,
        status: (r.isLocked ? "STOPPED" : "ACTIVE") as AccountStatus
      })),
      page,
      pageSize,
      totalItems
    });
  } catch (e) {
    console.error("[GET /api/admin/accounts]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}

