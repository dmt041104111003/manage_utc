import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enterpriseUserHasLinkedData } from "@/lib/admin/enterprise-linked-data";

export async function deleteEnterpriseUserCascade(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  if (!user || user.role !== Role.doanhnghiep) {
    return { ok: false, message: "Không tìm thấy doanh nghiệp." };
  }
  if (await enterpriseUserHasLinkedData(userId)) {
    return {
      ok: false,
      message: "Không thể xóa tài khoản đã phê duyệt hoặc đã có dữ liệu liên kết trong hệ thống."
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const posts = await tx.jobPost.findMany({
        where: { enterpriseUserId: userId },
        select: { id: true }
      });
      const ids = posts.map((p) => p.id);
      if (ids.length > 0) {
        await tx.jobApplication.deleteMany({ where: { jobPostId: { in: ids } } });
      }
      await tx.jobPost.deleteMany({ where: { enterpriseUserId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch (e) {
    console.error("deleteEnterpriseUserCascade", e);
    return { ok: false, message: "Không thể xóa tài khoản (lỗi hệ thống)." };
  }
  return { ok: true };
}
