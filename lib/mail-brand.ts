/**
 * Giao diện email UTC — bảng 640px, header xanh đậm, không logo (dùng chung HTML + React Email).
 */
export const MAIL_BRAND = {
  headerBar: "#002f6c",
  headerText: "#ffffff",
  titleColor: "#002f6c",
  bodyText: "#111111",
  bodyBg: "#ffffff",
  pageBg: "#ffffff",
  link: "#002f6c",
  footerHeading: "#002f6c",
  footerText: "#333333",
  footerMuted: "#666666",
  innerWidth: 640,
  rule: "#e5e7eb"
} as const;

/** Giữ API cho .env; layout hiện không nhúng logo. */
export function getSchoolEmailLogoUrl(): string {
  const a = String(process.env.NEXT_PUBLIC_SCHOOL_EMAIL_LOGO_URL || "").trim();
  const b = String(process.env.SCHOOL_EMAIL_LOGO_URL || "").trim();
  return a || b || "";
}
