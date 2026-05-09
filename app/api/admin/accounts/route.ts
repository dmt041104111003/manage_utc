import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";

type AccountStatus = "ACTIVE" | "STOPPED";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const roleParam = searchParams.get("role")?.trim() || "all";
  const statusParam = (searchParams.get("status")?.trim() || "all") as AccountStatus | "all";

  const where: Prisma.UserWhereInput = {
    role: { in: [Role.sinhvien, Role.giangvien, Role.doanhnghiep] }
  };
  const andParts: Prisma.UserWhereInput[] = [];

  if (q) {
    andParts.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { taxCode: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } }
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

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json({
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      fullName: r.role === Role.doanhnghiep ? r.companyName || r.fullName : r.fullName,
      email: r.email,
      phone: r.phone ?? null,
      role: r.role,
      status: (r.isLocked ? "STOPPED" : "ACTIVE") as AccountStatus
    }))
  });
}

