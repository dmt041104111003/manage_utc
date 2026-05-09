import type { Role } from "@prisma/client";
import { sendMail } from "@/lib/mail";
import { buildMailShell, escapeHtml, MAIL_ACCENT, mailCalloutHtml } from "@/lib/mail-layout";
import { SCHOOL_FULL_NAME, SCHOOL_HOTLINE, SCHOOL_WEBSITE } from "@/lib/constants/school";

function politeYou(role: Role): string {
  return role === "doanhnghiep" ? "Quý doanh nghiệp" : "Quý vị";
}

export function buildPasswordResetMail(fullName: string, role: Role, resetUrl: string) {
  const school = SCHOOL_FULL_NAME;
  const you = politeYou(role);
  const subject = `${school} - Yêu cầu đặt lại mật khẩu tài khoản`;

  const text = [
    `Kính gửi ${fullName},`,
    "",
    `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này trên hệ thống Quản lý thực tập ${school}.`,
    "",
    `Để tiếp tục quá trình thay đổi mật khẩu, ${you} vui lòng mở liên kết sau:`,
    resetUrl,
    "",
    "Lưu ý quan trọng:",
    "- Vì lý do bảo mật, đường dẫn này sẽ hết hiệu lực sau 15 phút.",
    `- Nếu ${you} không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn sẽ được giữ nguyên.`,
    "- Tuyệt đối không chia sẻ nội dung email này hoặc đường dẫn phía trên cho bất kỳ ai.",
    `Nếu gặp khó khăn trong quá trình khôi phục mật khẩu, bạn có thể liên hệ với bộ phận kỹ thuật của nhà trường qua số hotline: ${SCHOOL_HOTLINE}.`,
    "",
    "Trân trọng,",
    `Ban Quản trị Hệ thống ${school}`,
    SCHOOL_WEBSITE
  ].join("\n");

  const safeName = escapeHtml(fullName);
  const safeYou = escapeHtml(you);
  const safeSchool = escapeHtml(school);
  const safeHotline = escapeHtml(SCHOOL_HOTLINE);
  const safeWebsite = escapeHtml(SCHOOL_WEBSITE);
  const hrefReset = escapeHtml(resetUrl);
  const hrefSite = escapeHtml(SCHOOL_WEBSITE);

  const notesList = `<ul style="margin:0;padding-left:18px;">
<li style="margin-bottom:8px;">Vì lý do bảo mật, đường dẫn này sẽ <strong>hết hiệu lực sau 15 phút</strong>.</li>
<li style="margin-bottom:8px;">Nếu ${safeYou} không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn sẽ được giữ nguyên.</li>
<li style="margin-bottom:0;">Tuyệt đối không chia sẻ nội dung email này hoặc đường dẫn phía trên cho bất kỳ ai.</li>
</ul>`;

  const bodyHtml = `
<p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${MAIL_ACCENT.primary};">Đặt lại mật khẩu</p>
<p style="margin:0 0 14px;font-size:20px;font-weight:700;color:${MAIL_ACCENT.text};line-height:1.3;">Xác nhận yêu cầu của bạn</p>
<p style="margin:0 0 14px">Kính gửi <strong>${safeName}</strong>,</p>
<p style="margin:0 0 14px">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này trên hệ thống <strong>Quản lý thực tập ${safeSchool}</strong>.</p>
<p style="margin:0 0 20px">Để tiếp tục quá trình thay đổi mật khẩu, ${safeYou} vui lòng nhấn vào nút bên dưới:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
<tr><td style="background:${MAIL_ACCENT.primary};">
<a href="${hrefReset}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">ĐẶT LẠI MẬT KHẨU</a>
</td></tr>
</table>
${mailCalloutHtml("warning", "Lưu ý quan trọng", notesList)}
<p style="margin:18px 0 0;font-size:14px;color:#374151;">Nếu gặp khó khăn trong quá trình khôi phục mật khẩu, vui lòng liên hệ <strong>bộ phận kỹ thuật</strong> của Nhà trường qua số hotline: <strong style="color:${MAIL_ACCENT.primary};">${safeHotline}</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr><td height="1" style="background:#d1d9e6;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<p style="margin:16px 0 0;font-size:14px;color:${MAIL_ACCENT.text};">Trân trọng,</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#374151;">
<strong style="color:${MAIL_ACCENT.primary};">Ban Quản trị Hệ thống</strong><br/>
<strong>${safeSchool}</strong><br/>
<a href="${hrefSite}" style="color:${MAIL_ACCENT.primary};text-decoration:none;font-size:13px;">${safeWebsite}</a>
</p>
`.trim();

  const html = buildMailShell({
    bodyHtml,
    belowCardHtml: `Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:<br/><span style="word-break:break-all;color:#475569;">${escapeHtml(resetUrl)}</span>`
  });

  return { subject, text, html };
}

export async function sendPasswordResetEmail(to: string, fullName: string, role: Role, resetUrl: string) {
  const { subject, text, html } = buildPasswordResetMail(fullName, role, resetUrl);
  await sendMail(to, subject, text, html);
}
