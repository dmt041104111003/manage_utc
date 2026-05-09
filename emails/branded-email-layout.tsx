import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text
} from "@react-email/components";
import type { ReactNode } from "react";
import {
  DEFAULT_SUPPORT_EMAIL,
  ENTERPRISE_MAIL_SIGN_OFF_ADDRESS,
  SCHOOL_EMAIL_LOGO_URL,
  SCHOOL_FULL_NAME,
  SCHOOL_HOTLINE,
  SCHOOL_WEBSITE
} from "@/lib/constants/school";

/** Nền header xanh đậm + vàng đặc trưng nhận diện UTC (logo vòng ngoài vàng) */
const C = {
  headerTop: "#c9a227",
  headerBg: "#121c4a",
  headerBgMid: "#1a2a6e",
  pageBg: "#eef2f8",
  border: "#c5ced9",
  text: "#1f2937",
  muted: "#5b6470",
  footerBg: "#121c4a",
  footerDeep: "#0b1029"
} as const;

const font =
  'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif';

type Props = {
  preview: string;
  children: ReactNode;
};

export function BrandedEmailLayout({ preview, children }: Props) {
  return (
    <Html lang="vi">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: C.pageBg, fontFamily: font }}>
        <Section style={{ padding: "32px 14px 40px" }}>
          <Container
            style={{
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#ffffff",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(15,23,42,0.08)"
            }}
          >
            <Row>
              <Column style={{ height: 4, backgroundColor: C.headerTop, lineHeight: 0, fontSize: 0 }}>&nbsp;</Column>
            </Row>
            <Section
              style={{
                backgroundColor: C.headerBg,
                backgroundImage: `linear-gradient(135deg, ${C.headerBg} 0%, ${C.headerBgMid} 55%, ${C.headerBg} 100%)`,
                padding: "20px 26px 22px"
              }}
            >
              <Row>
                <Column style={{ width: 84, verticalAlign: "middle", paddingRight: 4 }}>
                  <Img
                    src={SCHOOL_EMAIL_LOGO_URL}
                    width="72"
                    height="72"
                    alt="Logo Trường Đại học Giao thông Vận tải - UTC"
                    style={{ display: "block", borderRadius: 8 }}
                  />
                </Column>
                <Column style={{ verticalAlign: "middle" }}>
                  <Text
                    style={{
                      margin: "0 0 6px",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#e8d48a"
                    }}
                  >
                    Bộ Giáo dục và Đào tạo
                  </Text>
                  <Text style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#ffffff", lineHeight: 1.3 }}>
                    {SCHOOL_FULL_NAME}
                  </Text>
                  <Text style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>
                    Phòng Đào tạo · Hệ thống Quản lý thực tập
                  </Text>
                </Column>
              </Row>
            </Section>
            <Hr style={{ borderColor: C.border, borderWidth: 1, margin: 0 }} />
            <Section style={{ padding: "28px 28px 26px", fontSize: 14, lineHeight: 1.65, color: C.text }}>{children}</Section>
            <Hr style={{ borderColor: C.border, borderWidth: 1, margin: 0 }} />
            <Section style={{ backgroundColor: C.footerBg, padding: "18px 28px 14px" }}>
              <Text style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                Liên hệ
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Địa chỉ · </span>
                {ENTERPRISE_MAIL_SIGN_OFF_ADDRESS}
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Điện thoại · </span>
                <strong style={{ color: "#ffffff" }}>{SCHOOL_HOTLINE}</strong>
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Email · </span>
                <Link href={`mailto:${DEFAULT_SUPPORT_EMAIL}`} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
                  {DEFAULT_SUPPORT_EMAIL}
                </Link>
              </Text>
              <Text style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Website · </span>
                <Link href={SCHOOL_WEBSITE} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
                  {SCHOOL_WEBSITE}
                </Link>
              </Text>
            </Section>
            <Section style={{ backgroundColor: C.footerDeep, padding: "12px 28px 14px" }}>
              <Text style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.55 }}>
                Email tự động từ Hệ thống Quản lý thực tập — {SCHOOL_FULL_NAME}. Vui lòng không trả lời trực tiếp email này.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
