import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { ROLE_HOME } from "@/lib/constants/routing";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    const { role } = await verifySession(token);
    const home = ROLE_HOME[role] ?? "/";
    return NextResponse.json({ authenticated: true, role, home });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
