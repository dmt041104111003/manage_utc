/** Màu / layout thống nhất: transactional HTML (mail-layout) + React Email (branded-email-layout). */
export const MAIL_BRAND = {
  headerTop: "#c9a227",
  headerBg: "#121c4a",
  headerBgMid: "#1a2a6e",
  pageBg: "#eef2f8",
  border: "#c5ced9",
  text: "#1f2937",
  muted: "#5b6470",
  footerBg: "#121c4a",
  footerDeep: "#0b1029"
} as const;

/** Logo email: cấu hình URL tĩnh (CDN/trường). Không hardcode cloud lạ. */
export function getSchoolEmailLogoUrl(): string {
  const a = String(process.env.NEXT_PUBLIC_SCHOOL_EMAIL_LOGO_URL || "").trim();
  const b = String(process.env.SCHOOL_EMAIL_LOGO_URL || "").trim();
  return a || b || "";
}
