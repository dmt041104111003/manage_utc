import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

/** Ten hien thi o sidebar: DN -> companyName; GV/SV/Admin -> fullName */
export async function getDashboardSidebarDisplayName(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { sub } = await verifySession(token);
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { fullName: true, companyName: true, role: true }
    });
    if (!user) return null;
    if (user.role === "doanhnghiep") {
      const c = user.companyName?.trim();
      return c && c.length > 0 ? c : user.fullName;
    }
    return user.fullName;
  } catch {
    return null;
  }
}
