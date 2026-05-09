import nodemailer from "nodemailer";

function createTransport() {
  const user = process.env.EMAIL_FROM;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) {
    throw new Error("EMAIL_FROM và EMAIL_PASSWORD phải được cấu hình trong .env.local");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

export async function sendMail(to: string, subject: string, text: string, htmlOverride?: string) {
  const transport = createTransport();
  const from = `"${process.env.EMAIL_FROM_NAME || "Hệ thống thực tập UTC"}" <${process.env.EMAIL_FROM}>`;
  const html =
    htmlOverride ??
    text.split("\n").map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br/>")).join("");
  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
