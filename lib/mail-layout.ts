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

/** Khớp globals.css (--primary, --text, --muted, --bg, --border). */
export const MAIL_ACCENT = {
  primary:     "#005bac",
  primaryDark: "#004a8a",
  success:     "#027a48",
  danger:      "#b42318",
  warning:     "#92400e",
  muted:       "#5b6470",
  text:        "#1f2937",
  border:      "#d5dce5",
  pageBg:      "#f4f7fb",
  headerBg:    "#005bac",
  footerBg:    "#1f2937"
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
      ? `<td style="width:84px;vertical-align:middle;padding-right:4px;">
           <img src="${escapeHtml(logoUrl)}" width="72" height="72" alt=""
                style="display:block;border-radius:8px;" />
         </td>`
      : "";
  const grad = `linear-gradient(135deg, ${MAIL_BRAND.headerBg} 0%, ${MAIL_BRAND.headerBgMid} 55%, ${MAIL_BRAND.headerBg} 100%)`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td height="4" style="background:${MAIL_BRAND.headerTop};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="background:${MAIL_BRAND.headerBg};background-image:${grad};padding:20px 26px 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${logoCell}
          <td style="vertical-align:middle;">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:9px;font-weight:700;
                      letter-spacing:0.12em;text-transform:uppercase;color:#e8d48a;">
              Bộ Giáo dục và Đào tạo
            </p>
            <p style="margin:0 0 8px;font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">
              ${safeName}
            </p>
            <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:600;color:rgba(255,255,255,0.88);">
              Phòng Đào tạo · ${safeProduct}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td height="1" style="background:${MAIL_BRAND.border};font-size:0;line-height:0;">&nbsp;</td>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td height="1" style="background:${MAIL_BRAND.border};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="background:${MAIL_BRAND.footerBg};padding:18px 28px 14px;">
      <p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:700;
                color:rgba(255,255,255,0.45);text-transform:uppercase;">Liên hệ</p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;line-height:1.8;color:rgba(255,255,255,0.78);">
        <span style="color:rgba(255,255,255,0.5);">Địa chỉ · </span>${safeAddr}
      </p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:rgba(255,255,255,0.78);">
        <span style="color:rgba(255,255,255,0.5);">Điện thoại · </span><strong style="color:#ffffff;">${safeHotline}</strong>
      </p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:rgba(255,255,255,0.78);">
        <span style="color:rgba(255,255,255,0.5);">Email · </span>
        <a href="mailto:${safeEmail}" style="color:rgba(255,255,255,0.85);text-decoration:none;">${safeEmail}</a>
      </p>
      <p style="margin:0;font-family:${FONT};font-size:12px;color:rgba(255,255,255,0.78);">
        <span style="color:rgba(255,255,255,0.5);">Website · </span>
        <a href="${safeWeb}" style="color:rgba(255,255,255,0.85);text-decoration:none;">${safeWeb}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:${MAIL_BRAND.footerDeep};padding:12px 28px 14px;">
      <p style="margin:0;font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.42);line-height:1.55;">
        Email tự động từ ${safeProduct} — ${safeName}. Vui lòng không trả lời trực tiếp email này.
      </p>
    </td>
  </tr>
</table>`.trim();
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
</head>
<body style="margin:0;padding:0;background:${MAIL_BRAND.pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:${MAIL_BRAND.pageBg};padding:32px 14px 40px;">
  <tr><td align="center">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:600px;background:#ffffff;overflow:hidden;border-radius:10px;
                  border:1px solid ${MAIL_BRAND.border};
                  box-shadow:0 12px 40px rgba(15,23,42,0.08);">

      <tr><td style="padding:0;line-height:0;">${buildHeader()}</td></tr>

      <tr>
        <td style="padding:28px 28px 24px;font-family:${FONT};
                   font-size:14px;line-height:1.7;color:${MAIL_ACCENT.text};">
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
    info:    { bg: "#eff6ff", border: "#005bac", title: "#005bac" },
    success: { bg: "#ecfdf5", border: "#027a48", title: "#027a48" },
    warning: { bg: "#fffbeb", border: "#d97706", title: "#92400e" },
    danger:  { bg: "#fff1f0", border: "#b42318", title: "#b42318" }
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
                  color:${MAIL_ACCENT.text};line-height:1.65;">${innerHtml}</div>
    </td>
  </tr>
</table>`.trim();
}
