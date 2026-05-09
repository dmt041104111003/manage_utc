/**
 * Giao diện email sáng — thư công văn / Phòng Đào tạo (UTC Hà Nội), không khối header/footer tối.
 * Dùng chung cho lib/mail-layout (HTML chuỗi) và emails/branded-email-layout (React Email).
 */
export const MAIL_BRAND = {
  accentBar: "#c9a227",
  headerStrip: "#f7f9fc",
  headerTitle: "#0c1f3f",
  headerKicker: "#005bac",
  headerSubtitle: "#556575",

  pageBg: "#eef1f5",
  cardBorder: "#c5ced9",
  rule: "#e2e8f0",

  footerStrip: "#f8fafc",
  footerNote: "#f1f5f9",

  text: "#1e293b",
  muted: "#64748b",
  link: "#005bac"
} as const;

/** Logo email: URL tĩnh HTTPS (CDN/trường). */
export function getSchoolEmailLogoUrl(): string {
  const a = String(process.env.NEXT_PUBLIC_SCHOOL_EMAIL_LOGO_URL || "").trim();
  const b = String(process.env.SCHOOL_EMAIL_LOGO_URL || "").trim();
  return a || b || "";
}
