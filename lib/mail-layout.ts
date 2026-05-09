import {
  DEFAULT_SUPPORT_EMAIL,
  ENTERPRISE_MAIL_SIGN_OFF_ADDRESS,
  MAIL_PRODUCT_NAME,
  SCHOOL_FULL_NAME,
  SCHOOL_HOTLINE,
  SCHOOL_WEBSITE
} from "@/lib/constants/school";
import { getSchoolEmailLogoUrl, MAIL_BRAND } from "@/lib/mail-brand";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Khớp globals.css — callout, nút. */
export const MAIL_ACCENT = {
  primary: "#005bac",
  primaryDark: "#004a8a",
  success: "#027a48",
  danger: "#b42318",
  warning: "#92400e",
  muted: "#5b6470",
  text: "#1f2937",
  border: "#d5dce5",
  pageBg: "#f4f7fb",
  headerBg: "#005bac",
  footerBg: "#1f2937"
} as const;

type MailShellOptions = {
  bodyHtml: string;
  belowCardHtml?: string;
};

const FONT =
  'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif';

function buildHeader(): string {
  const safeName = escapeHtml(SCHOOL_FULL_NAME);
  const safeProduct = escapeHtml(MAIL_PRODUCT_NAME);
  const logoUrl = getSchoolEmailLogoUrl();
  const logoCell =
    logoUrl !== ""
      ? `<td style="width:84px;vertical-align:top;padding-right:14px;">
           <img src="${escapeHtml(logoUrl)}" width="64" height="64" alt=""
                style="display:block;border-radius:6px;border:1px solid ${MAIL_BRAND.rule};" />
         </td>`
      : "";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
       style="background-color:#ffffff;">
  <tr>
    <td height="3" bgcolor="${MAIL_BRAND.accentBar}" style="background-color:${MAIL_BRAND.accentBar};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td bgcolor="${MAIL_BRAND.headerStrip}" style="background-color:${MAIL_BRAND.headerStrip};padding:18px 26px 16px;border-bottom:1px solid ${MAIL_BRAND.rule};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${logoCell}
          <td style="vertical-align:top;color:${MAIL_BRAND.text};">
            <p style="margin:0 0 4px;font-family:${FONT};font-size:10px;font-weight:700;
                      letter-spacing:0.1em;text-transform:uppercase;color:${MAIL_BRAND.headerKicker};">
              Bộ Giáo dục và Đào tạo
            </p>
            <p style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:700;color:${MAIL_BRAND.headerTitle};line-height:1.3;">
              ${safeName}
            </p>
            <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:500;color:${MAIL_BRAND.headerSubtitle};">
              Phòng Đào tạo · ${safeProduct}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildFooter(): string {
  const safeAddr = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_ADDRESS);
  const safeHotline = escapeHtml(SCHOOL_HOTLINE);
  const safeEmail = escapeHtml(DEFAULT_SUPPORT_EMAIL);
  const safeWeb = escapeHtml(SCHOOL_WEBSITE);
  const safeName = escapeHtml(SCHOOL_FULL_NAME);
  const safeProduct = escapeHtml(MAIL_PRODUCT_NAME);

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${MAIL_BRAND.footerStrip}"
       style="background-color:${MAIL_BRAND.footerStrip};">
  <tr>
    <td style="padding:16px 28px 14px;border-top:1px solid ${MAIL_BRAND.rule};">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:10px;font-weight:700;
                letter-spacing:0.08em;text-transform:uppercase;color:${MAIL_BRAND.muted};">Thông tin liên hệ</p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;line-height:1.75;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Địa chỉ · </span>${safeAddr}
      </p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Điện thoại · </span><strong>${safeHotline}</strong>
      </p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Email · </span>
        <a href="mailto:${safeEmail}" style="color:${MAIL_BRAND.link};text-decoration:underline;">${safeEmail}</a>
      </p>
      <p style="margin:0;font-family:${FONT};font-size:12px;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Website · </span>
        <a href="${safeWeb}" style="color:${MAIL_BRAND.link};text-decoration:underline;">${safeWeb}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="${MAIL_BRAND.footerNote}" style="background-color:${MAIL_BRAND.footerNote};padding:12px 28px 14px;border-top:1px solid ${MAIL_BRAND.rule};">
      <p style="margin:0;font-family:${FONT};font-size:11px;color:${MAIL_BRAND.muted};line-height:1.55;">
        <em>Email tự động</em> từ ${safeProduct} — ${safeName}. Vui lòng không trả lời trực tiếp thư này.
      </p>
    </td>
  </tr>
</table>`.trim();
}

/** Kết thư kiểu công văn: gạch ngang + Trân trọng + Phòng Đào tạo + tên trường. */
export function mailLetterClosingHtml(): string {
  const safeName = escapeHtml(SCHOOL_FULL_NAME);
  return `
<hr style="border:none;border-top:1px solid ${MAIL_BRAND.rule};margin:22px 0 18px;" />
<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${MAIL_BRAND.text};">Trân trọng,</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;color:${MAIL_BRAND.text};">
  <strong style="color:${MAIL_BRAND.headerTitle};">Phòng Đào tạo</strong><br/>
  <span style="color:${MAIL_BRAND.muted};">${safeName}</span>
</p>`.trim();
}

export function buildMailShell({ bodyHtml, belowCardHtml }: MailShellOptions): string {
  const below = belowCardHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
              style="max-width:600px;margin:0 auto;">
        <tr>
          <td style="padding:10px 28px 0;font-family:${FONT};font-size:12px;
                     line-height:1.55;color:${MAIL_ACCENT.muted};">
            ${belowCardHtml}
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background:${MAIL_BRAND.pageBg};color-scheme:light;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:${MAIL_BRAND.pageBg};padding:28px 14px 36px;">
  <tr><td align="center">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           bgcolor="#ffffff" style="max-width:600px;background:#ffffff;overflow:hidden;border-radius:8px;
                  border:1px solid ${MAIL_BRAND.cardBorder};
                  box-shadow:0 4px 24px rgba(15,23,42,0.06);">

      <tr><td style="padding:0;line-height:0;">${buildHeader()}</td></tr>

      <tr>
        <td bgcolor="#ffffff" style="padding:26px 28px 22px;font-family:${FONT};
                   font-size:14px;line-height:1.75;color:${MAIL_BRAND.text};">
          ${bodyHtml}
        </td>
      </tr>

      <tr><td style="padding:0;line-height:0;">${buildFooter()}</td></tr>

    </table>

    ${below}

  </td></tr>
</table>
</body>
</html>`;
}

export function mailCalloutHtml(
  variant: "info" | "success" | "warning" | "danger",
  title: string,
  innerHtml: string
): string {
  const map = {
    info: { bg: "#eff6ff", border: "#005bac", title: "#005bac" },
    success: { bg: "#ecfdf5", border: "#027a48", title: "#027a48" },
    warning: { bg: "#fffbeb", border: "#d97706", title: "#92400e" },
    danger: { bg: "#fff1f0", border: "#b42318", title: "#b42318" }
  }[variant];

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="margin:18px 0;border-left:4px solid ${map.border};background:${map.bg};">
  <tr>
    <td style="padding:12px 16px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;font-weight:700;
                letter-spacing:0.05em;text-transform:uppercase;
                color:${map.title};">${escapeHtml(title)}</p>
      <div style="font-family:${FONT};font-size:14px;
                  color:${MAIL_BRAND.text};line-height:1.65;">${innerHtml}</div>
    </td>
  </tr>
</table>`.trim();
}
