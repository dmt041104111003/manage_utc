
import { SCHOOL_FULL_NAME } from "@/lib/constants/school";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Khớp app/globals.css (--primary, --text, --muted, --bg). */
export const MAIL_ACCENT = {
  primary: "#005bac",
  success: "#027a48",
  danger: "#b42318",
  muted: "#5b6470",
  text: "#1f2937",
  pageBg: "#f4f7fb"
} as const;

type MailShellOptions = {
  bodyHtml: string;
  belowCardHtml?: string;
};

export function buildMailShell({ bodyHtml, belowCardHtml }: MailShellOptions): string {
  const fontStack = "Arial,Helvetica,sans-serif";
  const below = belowCardHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:16px auto 0;">
<tr><td style="padding:0 8px;font-family:${fontStack};font-size:12px;line-height:1.5;color:${MAIL_ACCENT.muted};">${belowCardHtml}</td></tr>
</table>`
    : "";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${MAIL_ACCENT.pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MAIL_ACCENT.pageBg};padding:28px 14px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:0;overflow:hidden;">
<tr><td style="padding:22px 26px 0;font-family:${fontStack};font-size:13px;font-weight:700;line-height:1.4;color:${MAIL_ACCENT.primary};">${escapeHtml(SCHOOL_FULL_NAME)}</td></tr>
<tr><td style="padding:14px 26px 22px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${MAIL_ACCENT.text};">
${bodyHtml}
</td></tr>
</table>
${below}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto 0;">
<tr><td align="center" style="font-family:${fontStack};font-size:11px;color:${MAIL_ACCENT.muted};">Email được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp nếu không cần thiết.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function mailCalloutHtml(
  variant: "info" | "success" | "warning",
  title: string,
  innerHtml: string
): string {
  const styles = {
    info: { bg: "#eff6ff", title: "#004a8a" },
    success: { bg: "#ecfdf5", title: MAIL_ACCENT.success },
    warning: { bg: "#fffbeb", title: "#92400e" }
  }[variant];
  return `<div style="margin:18px 0;padding:14px 16px;background:${styles.bg};">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${styles.title};letter-spacing:0.02em;">${escapeHtml(title)}</p>
<div style="margin:0;font-size:14px;color:${MAIL_ACCENT.text};line-height:1.55;">${innerHtml}</div>
</div>`;
}
