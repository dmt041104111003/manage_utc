import { EnterpriseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function enterpriseUserHasLinkedData(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, enterpriseStatus: true }
  });
  if (!u || u.role !== Role.doanhnghiep) return true;
  if (u.enterpriseStatus === EnterpriseStatus.APPROVED) return true;
  return false;
}
