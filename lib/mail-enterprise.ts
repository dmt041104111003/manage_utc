import { sendMail } from "@/lib/mail";
import { buildMailShell, escapeHtml, MAIL_ACCENT, mailCalloutHtml } from "@/lib/mail-layout";
import {
  DEFAULT_SUPPORT_EMAIL,
  ENTERPRISE_MAIL_SIGN_OFF_ADDRESS,
  ENTERPRISE_MAIL_SIGN_OFF_NAME,
  ENTERPRISE_MAIL_SIGN_OFF_SCHOOL,
  ENTERPRISE_MAIL_SIGN_OFF_TITLE,
  MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX,
  SCHOOL_HOTLINE
} from "@/lib/constants/school";

export function getPublicAppUrl() {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (base) return base;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
}

function greetingLine(companyName: string) {
  return companyName.trim() ? `Kính gửi ${companyName},` : "Kính gửi Quý Doanh nghiệp,";
}

function buildApprovedHtml(
  companyName: string,
  loginPath: string,
  loginEmail: string
): { text: string; bodyHtml: string } {
  const greet = greetingLine(companyName);
  const school = ENTERPRISE_MAIL_SIGN_OFF_SCHOOL;
  const support = supportEmail();
  const text = [
    greet,
    "",
    `Thay mặt ${school}, chúng tôi xin trân trọng thông báo hồ sơ đăng ký tham gia hệ thống Quản lý thực tập của Quý doanh nghiệp đã được phê duyệt thành công.`,
    "",
    "Kể từ bây giờ, Quý doanh nghiệp có thể đăng nhập vào hệ thống để đăng tin tuyển dụng thực tập sinh, quản lý hồ sơ sinh viên ứng tuyển và theo dõi quá trình thực tập của sinh viên tại đơn vị.",
    "",
    "Thông tin đăng nhập của Quý doanh nghiệp như sau:",
    `Địa chỉ hệ thống: ${loginPath}`,
    `Tên đăng nhập: ${loginEmail}`,
    "Mật khẩu tạm thời: Mã số thuế đã đăng ký (Quý doanh nghiệp vui lòng dùng đúng mã số thuế để đăng nhập lần đầu).",
    "",
    "Lưu ý quan trọng:",
    "- Để đảm bảo tính bảo mật, Quý doanh nghiệp vui lòng thay đổi mật khẩu ngay trong lần đăng nhập đầu tiên.",
    "- Quý doanh nghiệp vui lòng cập nhật đầy đủ thông tin hồ sơ và các vị trí tuyển dụng để sinh viên có thể tìm thấy và ứng tuyển.",
    "",
    "Trong quá trình sử dụng hệ thống, nếu gặp bất kỳ khó khăn nào, Quý doanh nghiệp vui lòng liên hệ với chúng tôi qua:",
    `Email: ${support}`,
    `Số điện thoại: ${SCHOOL_HOTLINE}`,
    "",
    "Chúng tôi rất mong đợi sự hợp tác tốt đẹp giữa Quý doanh nghiệp và Nhà trường trong việc đào tạo và phát triển nguồn nhân lực trẻ.",
    "",
    "Trân trọng,",
    ENTERPRISE_MAIL_SIGN_OFF_NAME,
    ENTERPRISE_MAIL_SIGN_OFF_TITLE,
    ENTERPRISE_MAIL_SIGN_OFF_SCHOOL,
    ENTERPRISE_MAIL_SIGN_OFF_ADDRESS
  ].join("\n");

  const safeGreet = escapeHtml(greet);
  const safeSchool = escapeHtml(school);
  const hrefLogin = escapeHtml(loginPath);
  const safeEmail = escapeHtml(loginEmail);
  const safeSupport = escapeHtml(support);
  const safeHotline = escapeHtml(SCHOOL_HOTLINE);
  const safeName = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_NAME);
  const safeTitle = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_TITLE);
  const safeSchoolSign = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_SCHOOL);
  const safeAddr = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_ADDRESS);

  const credentialBlock = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f0f9ff;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${MAIL_ACCENT.primary};text-transform:uppercase;letter-spacing:0.04em;">Thông tin đăng nhập</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr><td style="padding:6px 0;color:#64748b;width:150px;vertical-align:top;">Địa chỉ hệ thống</td><td style="padding:6px 0;vertical-align:top;"><a href="${hrefLogin}" style="color:${MAIL_ACCENT.primary};font-weight:600;text-decoration:none;word-break:break-all;">${escapeHtml(loginPath)}</a></td></tr>
<tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Tên đăng nhập</td><td style="padding:6px 0;vertical-align:top;"><strong>${safeEmail}</strong></td></tr>
<tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Mật khẩu tạm thời</td><td style="padding:6px 0;vertical-align:top;">Mã số thuế đã đăng ký <span style="color:#64748b;">(dùng đúng mã số thuế để đăng nhập lần đầu)</span></td></tr>
</table>
</td></tr>
</table>`;

  const noteInner = `<ul style="margin:0;padding-left:18px;">
<li style="margin-bottom:8px;">Để đảm bảo <strong>bảo mật</strong>, Quý doanh nghiệp vui lòng <strong>đổi mật khẩu ngay</strong> trong lần đăng nhập đầu tiên.</li>
<li style="margin-bottom:0;">Vui lòng cập nhật đầy đủ hồ sơ và các vị trí tuyển dụng để sinh viên có thể tìm thấy và ứng tuyển.</li>
</ul>`;

  const bodyHtml = `
<p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${MAIL_ACCENT.success};">Phê duyệt thành công</p>
<p style="margin:0 0 14px;font-size:20px;font-weight:700;color:${MAIL_ACCENT.text};line-height:1.3;">Thông báo kết nối thực tập</p>
<p style="margin:0 0 14px">${safeGreet}</p>
<p style="margin:0 0 14px">Thay mặt <strong>${safeSchool}</strong>, chúng tôi xin trân trọng thông báo hồ sơ đăng ký tham gia hệ thống <strong>Quản lý thực tập</strong> của Quý doanh nghiệp đã được <strong style="color:${MAIL_ACCENT.success};">phê duyệt thành công</strong>.</p>
<p style="margin:0 0 16px">Kể từ bây giờ, Quý doanh nghiệp có thể đăng nhập để đăng tin tuyển dụng thực tập sinh, quản lý hồ sơ ứng tuyển và theo dõi quá trình thực tập tại đơn vị.</p>
${credentialBlock}
${mailCalloutHtml("success", "Lưu ý quan trọng", noteInner)}
<p style="margin:18px 0 0;font-size:14px;color:#374151;">Trong quá trình sử dụng, nếu gặp khó khăn, vui lòng liên hệ:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 0;font-size:14px;">
<tr><td style="padding-right:16px;color:#64748b;">Email</td><td><a href="mailto:${escapeHtml(support)}" style="color:${MAIL_ACCENT.primary};font-weight:600;text-decoration:none;">${safeSupport}</a></td></tr>
<tr><td style="padding:6px 16px 0 0;color:#64748b;vertical-align:top;">Điện thoại</td><td style="padding-top:6px;"><strong style="color:${MAIL_ACCENT.text};">${safeHotline}</strong></td></tr>
</table>
<p style="margin:18px 0 0;font-size:14px;line-height:1.55;">Chúng tôi rất mong đợi sự hợp tác tốt đẹp giữa Quý doanh nghiệp và Nhà trường trong đào tạo và phát triển nguồn nhân lực trẻ.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr><td height="1" style="background:#d1d9e6;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<p style="margin:16px 0 0;font-size:14px;color:${MAIL_ACCENT.text};">Trân trọng,</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#374151;">
<strong style="color:${MAIL_ACCENT.primary};">${safeName}</strong><br/>
<em>${safeTitle}</em><br/>
<strong>${safeSchoolSign}</strong><br/>
<span style="color:#64748b;font-size:13px;">${safeAddr}</span>
</p>
`.trim();

  return { text, bodyHtml };
}

function buildRejectedHtml(companyName: string, reasons: string[], registerLink: string): { text: string; bodyHtml: string } {
  const greet = greetingLine(companyName);
  const school = ENTERPRISE_MAIL_SIGN_OFF_SCHOOL;
  const reasonBlock =
    reasons.length > 0
      ? reasons.map((r, i) => `[Lý do ${i + 1}: ${r}]`).join("\n")
      : "[Lý do: không được nêu chi tiết]";
  const text = [
    greet,
    "",
    `Lời đầu tiên, ${school} xin chân thành cảm ơn Quý doanh nghiệp đã quan tâm và gửi hồ sơ đăng ký tham gia hệ thống quản lý thực tập của nhà trường.`,
    "",
    "Sau khi xem xét các thông tin và hồ sơ đính kèm, chúng tôi rất tiếc phải thông báo rằng yêu cầu đăng ký tài khoản của Quý doanh nghiệp chưa được phê duyệt tại thời điểm này.",
    "",
    "Lý do cụ thể như sau:",
    reasonBlock,
    "",
    "Hướng dẫn xử lý:",
    `Nếu lý do liên quan đến hồ sơ hoặc thông tin sai sót, Quý doanh nghiệp vui lòng truy cập lại trang đăng ký tại địa chỉ ${registerLink} để cập nhật lại thông tin chính xác.`,
    "Nếu cần trao đổi thêm về các tiêu chí hợp tác, Quý doanh nghiệp có thể phản hồi trực tiếp qua email này.",
    "",
    "Chúng tôi rất hy vọng sẽ có cơ hội hợp tác với Quý doanh nghiệp trong các chương trình hoặc học kỳ tiếp theo khi các điều kiện phù hợp hơn.",
    "",
    "Trân trọng,",
    ENTERPRISE_MAIL_SIGN_OFF_NAME,
    ENTERPRISE_MAIL_SIGN_OFF_TITLE,
    ENTERPRISE_MAIL_SIGN_OFF_SCHOOL,
    `Số điện thoại hỗ trợ: ${SCHOOL_HOTLINE}`
  ].join("\n");

  const safeGreet = escapeHtml(greet);
  const safeSchool = escapeHtml(school);
  const hrefReg = escapeHtml(registerLink);
  const safeHotline = escapeHtml(SCHOOL_HOTLINE);
  const safeName = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_NAME);
  const safeTitle = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_TITLE);
  const safeSchoolSign = escapeHtml(ENTERPRISE_MAIL_SIGN_OFF_SCHOOL);

  const reasonsOl =
    reasons.length > 0
      ? `<ol style="margin:0;padding-left:20px;color:#1f2937;">
${reasons.map((r, i) => `<li style="margin-bottom:10px;"><strong style="color:${MAIL_ACCENT.danger};">Lý do ${i + 1}:</strong> ${escapeHtml(r)}</li>`).join("")}
</ol>`
      : `<p style="margin:0;color:#64748b;font-style:italic;">${escapeHtml("[Lý do: không được nêu chi tiết]")}</p>`;

  const reasonsBox = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="margin:16px 0;border-left:4px solid #fca5a5;background:#fff1f0;">
  <tr><td style="padding:12px 16px;">
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${MAIL_ACCENT.danger};text-transform:uppercase;letter-spacing:0.04em;">Lý do cụ thể</p>
    ${reasonsOl}
  </td></tr>
</table>`;

  const guideInner = `
<p style="margin:0 0 10px;">Nếu lý do liên quan đến hồ sơ hoặc thông tin sai sót, vui lòng <strong>cập nhật lại</strong> tại trang đăng ký.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
<tr><td style="background:${MAIL_ACCENT.primary};">
<a href="${hrefReg}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;">MỞ TRANG ĐĂNG KÝ</a>
</td></tr>
</table>
<p style="margin:14px 0 0;font-size:13px;color:#64748b;">Nếu cần trao đổi thêm, Quý doanh nghiệp có thể <strong>phản hồi trực tiếp</strong> qua email này.</p>`;

  const bodyHtml = `
<p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${MAIL_ACCENT.danger};">Kết quả xét duyệt</p>
<p style="margin:0 0 14px;font-size:20px;font-weight:700;color:${MAIL_ACCENT.text};line-height:1.3;">Thông báo đăng ký tài khoản</p>
<p style="margin:0 0 14px">${safeGreet}</p>
<p style="margin:0 0 14px">Lời đầu tiên, <strong>${safeSchool}</strong> xin chân thành cảm ơn Quý doanh nghiệp đã quan tâm và gửi hồ sơ đăng ký tham gia hệ thống quản lý thực tập.</p>
<p style="margin:0 0 14px">Sau khi xem xét thông tin và hồ sơ đính kèm, chúng tôi rất tiếc phải thông báo rằng yêu cầu <strong>chưa được phê duyệt</strong> tại thời điểm này.</p>
${reasonsBox}
${mailCalloutHtml("warning", "Hướng dẫn xử lý", guideInner)}
<p style="margin:18px 0 0;font-size:14px;line-height:1.55;">Chúng tôi rất hy vọng sẽ có cơ hội hợp tác trong các chương trình hoặc học kỳ tiếp theo khi điều kiện phù hợp hơn.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr><td height="1" style="background:#d1d9e6;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<p style="margin:16px 0 0;font-size:14px;color:${MAIL_ACCENT.text};">Trân trọng,</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#374151;">
<strong style="color:${MAIL_ACCENT.primary};">${safeName}</strong><br/>
<em>${safeTitle}</em><br/>
<strong>${safeSchoolSign}</strong><br/>
<span style="color:#64748b;font-size:13px;">&#9742;&nbsp; ${safeHotline}</span>
</p>
<p style="margin:14px 0 0;font-size:12px;color:${MAIL_ACCENT.muted};">Liên kết đăng ký (dự phòng): <span style="word-break:break-all;">${escapeHtml(registerLink)}</span></p>
`.trim();

  return { text, bodyHtml };
}

export async function sendEnterpriseApprovedEmail(to: string, companyName: string, loginEmail: string) {
  const appUrl = getPublicAppUrl();
  const loginPath = `${appUrl}/auth/dangnhap`;
  const subject = `${MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX} - Thông báo phê duyệt tài khoản kết nối thực tập thành công`;
  const { text, bodyHtml } = buildApprovedHtml(companyName, loginPath, loginEmail);
  const html = buildMailShell({ bodyHtml });
  await sendMail(to, subject, text, html);
}

export async function sendEnterpriseRejectedEmail(
  to: string,
  reasons: string[],
  companyName: string
) {
  const appUrl = getPublicAppUrl();
  const registerLink = `${appUrl}/auth/dangky`;
  const subject = `${MAIL_PHONG_DAO_TAO_SUBJECT_PREFIX} - Thông báo kết quả đăng ký tài khoản kết nối thực tập`;
  const { text, bodyHtml } = buildRejectedHtml(companyName, reasons, registerLink);
  const html = buildMailShell({ bodyHtml });
  await sendMail(to, subject, text, html);
}
