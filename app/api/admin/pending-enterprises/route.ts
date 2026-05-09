import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { stripHeavyEnterpriseMeta } from "@/lib/utils/enterprise-meta";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const rows = await prisma.user.findMany({
    where: { role: Role.doanhnghiep, enterpriseStatus: EnterpriseStatus.PENDING },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      companyName: true,
      taxCode: true,
      enterpriseMeta: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      enterpriseMeta: stripHeavyEnterpriseMeta(r.enterpriseMeta)
    }))
  });
}
