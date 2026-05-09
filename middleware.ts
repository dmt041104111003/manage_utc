import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_EXACT_ROUTES_REQUIRE_SESSION, ROLE_PROTECTED_ROUTE_PREFIXES } from "@/lib/constants/auth/guards";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { ROLE_HOME } from "@/lib/constants/routing";

function encodeSecret() {
  const s = process.env.SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

function loginRedirect(request: NextRequest, nextPath: string) {
  const login = new URL("/auth/dangnhap", request.url);
  login.searchParams.set("next", nextPath);
  return NextResponse.redirect(login);
}

function sessionHomeRedirect(request: NextRequest, role: string) {
  const home = ROLE_HOME[role];
  if (!home) return NextResponse.next();
  return NextResponse.redirect(new URL(home, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = encodeSecret();

  if (pathname === "/" && secret) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const role = typeof payload.role === "string" ? payload.role : "";
        return sessionHomeRedirect(request, role);
      } catch {
        const res = NextResponse.next();
        res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        return res;
      }
    }
  }

  const roleMatch = ROLE_PROTECTED_ROUTE_PREFIXES.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`)
  );

  if (roleMatch) {
    if (!secret) {
      return loginRedirect(request, pathname);
    }
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return loginRedirect(request, pathname);
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      const role = typeof payload.role === "string" ? payload.role : "";
      if (role !== roleMatch.role) {
        const home = ROLE_HOME[role] ?? "/";
        return NextResponse.redirect(new URL(home, request.url));
      }
    } catch {
      const res = loginRedirect(request, pathname);
      res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }

  if (AUTH_EXACT_ROUTES_REQUIRE_SESSION.includes(pathname as (typeof AUTH_EXACT_ROUTES_REQUIRE_SESSION)[number])) {
    if (!secret) {
      return loginRedirect(request, pathname);
    }
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return loginRedirect(request, pathname);
    }
    try {
      await jwtVerify(token, secret);
    } catch {
      const res = loginRedirect(request, pathname);
      res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }

  const isGuestAuthRoute =
    pathname.startsWith("/auth/") &&
    !AUTH_EXACT_ROUTES_REQUIRE_SESSION.includes(pathname as (typeof AUTH_EXACT_ROUTES_REQUIRE_SESSION)[number]);
  if (isGuestAuthRoute && secret) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const role = typeof payload.role === "string" ? payload.role : "";
        return sessionHomeRedirect(request, role);
      } catch {
        const res = NextResponse.next();
        res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/giangvien/:path*",
    "/sinhvien/:path*",
    "/doanhnghiep/:path*",
    "/auth/:path*"
  ]
};
