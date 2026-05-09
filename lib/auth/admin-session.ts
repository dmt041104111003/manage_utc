import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";

export async function getAdminSession(): Promise<{ sub: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { sub, role, email } = await verifySession(token);
    if (role !== "admin") return null;
    return { sub, email };
  } catch {
    return null;
  }
}
