/**
 * Giao diện email sáng — thư công văn / Phòng Đào tạo (UTC Hà Nội), không khối header/footer tối.
 * Dùng chung cho lib/mail-layout (HTML chuỗi) và emails/branded-email-layout (React Email).
 */
export const MAIL_BRAND = {
  accentBar: "#c9a227",
  headerStrip: "#f0f5fb",
  headerTitle: "#0a2540",
  headerKicker: "#005bac",
  headerSubtitle: "#4a5d78",

  pageBg: "#e8edf3",
  cardBorder: "#b8c5d8",
  rule: "#dce3ed",

  /** Nội dung thư — tách nền nhẹ, dễ đọc */
  contentBg: "#fafcfe",
  contentText: "#334155",
  stripe: "#005bac",

  footerStrip: "#f4f7fb",
  footerNote: "#eef2f7",

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
