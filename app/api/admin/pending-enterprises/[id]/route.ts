import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { stripHeavyEnterpriseMeta } from "@/lib/utils/enterprise-meta";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Thiếu mã hồ sơ." }, { status: 400 });
  }

  const row = await prisma.user.findFirst({
    where: {
      id,
      role: Role.doanhnghiep,
      enterpriseStatus: EnterpriseStatus.PENDING
    },
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

  if (!row) {
    return NextResponse.json({ message: "Không tìm thấy hồ sơ chờ phê duyệt." }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      enterpriseMeta: stripHeavyEnterpriseMeta(row.enterpriseMeta)
    }
  });
}
