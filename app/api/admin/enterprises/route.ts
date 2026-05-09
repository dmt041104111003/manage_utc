import { NextResponse } from "next/server";
import { EnterpriseStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim() || "";

    const where: Prisma.UserWhereInput = { role: Role.doanhnghiep };
    const andParts: Prisma.UserWhereInput[] = [];

    if (q) {
      andParts.push({
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { taxCode: { contains: q, mode: "insensitive" } }
        ]
      });
    }

    if (statusParam && statusParam !== "all" && Object.values(EnterpriseStatus).includes(statusParam as EnterpriseStatus)) {
      if (statusParam === EnterpriseStatus.PENDING) {
        andParts.push({
          OR: [{ enterpriseStatus: EnterpriseStatus.PENDING }, { enterpriseStatus: null }]
        });
      } else {
        andParts.push({ enterpriseStatus: statusParam as EnterpriseStatus });
      }
    }

    if (andParts.length) {
      where.AND = andParts;
    }

    const [rows, pending, approved, rejected] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          companyName: true,
          taxCode: true,
          enterpriseStatus: true,
          createdAt: true
        }
      }),
      prisma.user.count({
        where: {
          role: Role.doanhnghiep,
          OR: [{ enterpriseStatus: EnterpriseStatus.PENDING }, { enterpriseStatus: null }]
        }
      }),
      prisma.user.count({
        where: { role: Role.doanhnghiep, enterpriseStatus: EnterpriseStatus.APPROVED }
      }),
      prisma.user.count({
        where: { role: Role.doanhnghiep, enterpriseStatus: EnterpriseStatus.REJECTED }
      })
    ]);

    return NextResponse.json({
      success: true,
      enterpriseStatusStats: { pending, approved, rejected },
      items: rows.map((r) => ({
        ...r,
        enterpriseStatus: r.enterpriseStatus ?? EnterpriseStatus.PENDING,
        createdAt: r.createdAt.toISOString()
      }))
    });
  } catch (e) {
    console.error("[GET /api/admin/enterprises]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}
