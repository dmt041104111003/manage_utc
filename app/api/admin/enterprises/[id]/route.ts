import { NextResponse } from "next/server";
import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { deleteEnterpriseUserCascade } from "@/lib/admin/delete-enterprise-user";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      companyName: true,
      taxCode: true,
      representativeTitle: true,
      enterpriseStatus: true,
      isLocked: true,
      enterpriseMeta: true,
      createdAt: true,
      updatedAt: true,
      role: true
    }
  });

  if (!user || user.role !== Role.doanhnghiep) {
    return NextResponse.json({ message: "Không tìm thấy doanh nghiệp." }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...user,
      enterpriseStatus: user.enterpriseStatus ?? EnterpriseStatus.PENDING,
      isLocked: Boolean((user as any).isLocked),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true }
  });

  if (!user || user.role !== Role.doanhnghiep) {
    return NextResponse.json({ message: "Không tìm thấy doanh nghiệp." }, { status: 404 });
  }

  const del = await deleteEnterpriseUserCascade(id);
  if (!del.ok) {
    const conflict = del.message.includes("phê duyệt") || del.message.includes("liên kết");
    return NextResponse.json(
      { success: false, message: del.message },
      { status: conflict ? 409 : del.message.includes("Không tìm thấy") ? 404 : 500 }
    );
  }
  return NextResponse.json({ success: true, message: "Xóa tài khoản thành công." });
}
