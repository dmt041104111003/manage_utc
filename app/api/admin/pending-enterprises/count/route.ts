import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const count = await prisma.user.count({
    where: { role: Role.doanhnghiep, enterpriseStatus: EnterpriseStatus.PENDING }
  });

  return NextResponse.json({ count });
}
