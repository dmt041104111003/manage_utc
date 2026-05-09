import {
  DEFAULT_SUPPORT_EMAIL,
  ENTERPRISE_MAIL_SIGN_OFF_ADDRESS,
  SCHOOL_FULL_NAME,
  SCHOOL_HOTLINE,
  SCHOOL_WEBSITE
} from "@/lib/constants/school";

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

const FONT = "Arial,Helvetica,sans-serif";

function buildHeader(): string {
  const safeName = escapeHtml(SCHOOL_FULL_NAME);
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td height="3" style="background:${MAIL_ACCENT.primaryDark};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="background:${MAIL_ACCENT.headerBg};padding:20px 28px 18px;">
      <p style="margin:0 0 3px;font-family:${FONT};font-size:10px;font-weight:700;
                letter-spacing:0.13em;text-transform:uppercase;
                color:rgba(255,255,255,0.65);">Bộ Giáo dục và Đào tạo</p>
      <p style="margin:0 0 5px;font-family:${FONT};font-size:17px;font-weight:700;
                color:#ffffff;line-height:1.3;">${safeName}</p>
      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:500;
                color:rgba(255,255,255,0.75);letter-spacing:0.01em;">
        Phòng Đào tạo &nbsp;&bull;&nbsp; Hệ thống Quản lý Thực tập
      </p>
    </td>
  </tr>
  <tr>
    <td height="1" style="background:${MAIL_ACCENT.border};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`.trim();
}

function buildFooter(): string {
  const safeAddr    = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_ADDRESS);
  const safeHotline = escapeHtml(SCHOOL_HOTLINE);
  const safeEmail   = escapeHtml(DEFAULT_SUPPORT_EMAIL);
  const safeWeb     = escapeHtml(SCHOOL_WEBSITE);
  const safeName    = escapeHtml(SCHOOL_FULL_NAME);

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td height="1" style="background:${MAIL_ACCENT.border};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="background:${MAIL_ACCENT.footerBg};padding:18px 28px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0"
             style="font-family:${FONT};font-size:12px;line-height:1.9;
                    color:rgba(255,255,255,0.75);">
        <tr>
          <td style="padding-right:10px;white-space:nowrap;
                     color:rgba(255,255,255,0.5);font-weight:700;
                     font-size:11px;text-transform:uppercase;letter-spacing:0.05em;
                     vertical-align:top;">
            Địa chỉ
          </td>
          <td style="color:rgba(255,255,255,0.75);">${safeAddr}</td>
        </tr>
        <tr>
          <td style="padding-right:10px;white-space:nowrap;
                     color:rgba(255,255,255,0.5);font-weight:700;
                     font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
            Điện thoại
          </td>
          <td><strong style="color:#ffffff;">${safeHotline}</strong></td>
        </tr>
        <tr>
          <td style="padding-right:10px;white-space:nowrap;
                     color:rgba(255,255,255,0.5);font-weight:700;
                     font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
            Email
          </td>
          <td>
            <a href="mailto:${safeEmail}"
               style="color:rgba(255,255,255,0.75);text-decoration:none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding-right:10px;white-space:nowrap;
                     color:rgba(255,255,255,0.5);font-weight:700;
                     font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
            Website
          </td>
          <td>
            <a href="${safeWeb}"
               style="color:rgba(255,255,255,0.75);text-decoration:none;">${safeWeb}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#111827;padding:10px 28px;">
      <p style="margin:0;font-family:${FONT};font-size:11px;
                color:rgba(255,255,255,0.4);line-height:1.6;">
        Email này được gửi tự động từ Hệ thống Quản lý Thực tập &mdash; ${safeName}.<br/>
        Vui lòng không trả lời trực tiếp. Mọi thắc mắc xin liên hệ qua email hoặc số điện thoại nêu trên.
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
<body style="margin:0;padding:0;background:${MAIL_ACCENT.pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:${MAIL_ACCENT.pageBg};padding:32px 14px 40px;">
  <tr><td align="center">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:600px;background:#ffffff;overflow:hidden;
                  border:1px solid ${MAIL_ACCENT.border};
                  box-shadow:0 1px 4px rgba(0,91,172,0.08);">

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
