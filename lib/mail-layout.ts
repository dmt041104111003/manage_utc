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
  /* Nền trắng ô logo: client mail hay tô đen vùng alpha của PNG/WebP */
  const logoCell =
    logoUrl !== ""
      ? `<td valign="top" style="width:88px;padding-right:16px;">
           <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
                  style="background-color:#ffffff;border:1px solid ${MAIL_BRAND.rule};border-radius:8px;">
             <tr>
               <td align="center" valign="middle" bgcolor="#ffffff" style="background-color:#ffffff;padding:8px;">
                 <img src="${escapeHtml(logoUrl)}" width="56" height="56" alt=""
                      style="display:block;width:56px;height:56px;background-color:#ffffff;border:0;outline:none;text-decoration:none;" />
               </td>
             </tr>
           </table>
         </td>`
      : "";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
       style="background-color:#ffffff;">
  <tr>
    <td height="4" bgcolor="${MAIL_BRAND.accentBar}" style="background-color:${MAIL_BRAND.accentBar};font-size:4px;line-height:4px;">&nbsp;</td>
  </tr>
  <tr>
    <td bgcolor="${MAIL_BRAND.headerStrip}" style="background-color:${MAIL_BRAND.headerStrip};padding:20px 26px 18px;border-bottom:1px solid ${MAIL_BRAND.rule};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${logoCell}
          <td valign="top" style="vertical-align:top;color:${MAIL_BRAND.text};">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:700;
                      letter-spacing:0.12em;text-transform:uppercase;color:${MAIL_BRAND.headerKicker};line-height:1.4;">
              Bộ Giáo dục và Đào tạo
            </p>
            <p style="margin:0 0 8px;font-family:${FONT};font-size:18px;font-weight:700;color:${MAIL_BRAND.headerTitle};line-height:1.35;">
              ${safeName}
            </p>
            <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:600;color:${MAIL_BRAND.headerSubtitle};line-height:1.5;">
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
    <td style="padding:18px 28px 16px;border-top:1px solid ${MAIL_BRAND.rule};line-height:1.65;font-size:14px;">
      <p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:700;
                letter-spacing:0.1em;text-transform:uppercase;color:${MAIL_BRAND.headerKicker};line-height:1.4;">
        Thông tin liên hệ
      </p>
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:1.7;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Địa chỉ · </span>${safeAddr}
      </p>
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:1.7;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Điện thoại · </span><strong style="color:${MAIL_BRAND.headerTitle};">${safeHotline}</strong>
      </p>
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:1.7;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Email · </span>
        <a href="mailto:${safeEmail}" style="color:${MAIL_BRAND.link};text-decoration:underline;">${safeEmail}</a>
      </p>
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.7;color:${MAIL_BRAND.text};">
        <span style="color:${MAIL_BRAND.muted};">Website · </span>
        <a href="${safeWeb}" style="color:${MAIL_BRAND.link};text-decoration:underline;">${safeWeb}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="${MAIL_BRAND.footerNote}" style="background-color:${MAIL_BRAND.footerNote};padding:14px 28px 16px;border-top:1px solid ${MAIL_BRAND.rule};line-height:1.65;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;color:${MAIL_BRAND.muted};line-height:1.6;">
        Thư được gửi tự động từ <strong style="color:${MAIL_BRAND.text};">${safeProduct}</strong>.
      </p>
      <p style="margin:0;font-family:${FONT};font-size:12px;color:${MAIL_BRAND.muted};line-height:1.6;">
        Vui lòng không trả lời trực tiếp hộp thư này. Mọi thắc mắc xin liên hệ theo thông tin phía trên — ${safeName}.
      </p>
    </td>
  </tr>
</table>`.trim();
}

/** Gạch ngăn + kết thư (không dùng &lt;hr&gt; — một số client làm chồng dòng). */
export function mailLetterClosingHtml(): string {
  const safeName = escapeHtml(SCHOOL_FULL_NAME);
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 20px;">
  <tr>
    <td style="border-top:1px solid ${MAIL_BRAND.rule};height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
  </tr>
</table>
<p style="margin:0 0 4px;font-family:${FONT};font-size:15px;line-height:1.65;color:${MAIL_BRAND.contentText};">Trân trọng,</p>
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:${MAIL_BRAND.contentText};">
  <strong style="color:${MAIL_BRAND.headerTitle};">Phòng Đào tạo</strong><br/>
  <span style="color:${MAIL_BRAND.muted};font-size:14px;">${safeName}</span>
</p>`.trim();
}

export function buildMailShell({ bodyHtml, belowCardHtml }: MailShellOptions): string {
  const below = belowCardHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
              style="max-width:600px;margin:0 auto;">
        <tr>
          <td style="padding:12px 28px 0;font-family:${FONT};font-size:12px;
                     line-height:1.6;color:${MAIL_ACCENT.muted};">
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
       style="background:${MAIL_BRAND.pageBg};padding:32px 16px 40px;">
  <tr><td align="center" style="line-height:normal;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           bgcolor="#ffffff" style="max-width:600px;background:#ffffff;border-radius:10px;
                  border:1px solid ${MAIL_BRAND.cardBorder};
                  box-shadow:0 8px 32px rgba(0,91,172,0.08);">

      <tr><td style="padding:0;line-height:normal;">${buildHeader()}</td></tr>

      <tr>
        <td bgcolor="#ffffff" style="padding:0;line-height:normal;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="5" bgcolor="${MAIL_BRAND.stripe}" style="width:5px;min-width:5px;background-color:${MAIL_BRAND.stripe};font-size:1px;line-height:1px;">&nbsp;</td>
              <td bgcolor="${MAIL_BRAND.contentBg}" style="background-color:${MAIL_BRAND.contentBg};padding:26px 28px 28px 22px;font-family:${FONT};
                         font-size:15px;line-height:1.8;color:${MAIL_BRAND.contentText};">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr><td style="padding:0;line-height:normal;">${buildFooter()}</td></tr>

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
                color:${map.title};line-height:1.4;">${escapeHtml(title)}</p>
      <div style="font-family:${FONT};font-size:14px;line-height:1.7;
                  color:${MAIL_BRAND.contentText};">${innerHtml}</div>
    </td>
  </tr>
</table>`.trim();
}
