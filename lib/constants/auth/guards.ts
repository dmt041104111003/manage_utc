export const ROLE_PROTECTED_ROUTE_PREFIXES: { prefix: string; role: string }[] = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/giangvien", role: "giangvien" },
  { prefix: "/sinhvien", role: "sinhvien" },
  { prefix: "/doanhnghiep", role: "doanhnghiep" }
];

export const AUTH_EXACT_ROUTES_REQUIRE_SESSION = ["/auth/doimatkhau"] as const;
