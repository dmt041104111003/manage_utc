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
  MAIL_PRODUCT_NAME,
  SCHOOL_FULL_NAME,
  SCHOOL_HOTLINE,
  SCHOOL_WEBSITE
} from "@/lib/constants/school";
import { getSchoolEmailLogoUrl, MAIL_BRAND as B } from "@/lib/mail-brand";

const font =
  'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif';

type Props = {
  preview: string;
  children: ReactNode;
};

export function BrandedEmailLayout({ preview, children }: Props) {
  const logoUrl = getSchoolEmailLogoUrl();
  return (
    <Html lang="vi">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: B.pageBg, fontFamily: font, colorScheme: "light" }}>
        <Section style={{ padding: "32px 16px 40px" }}>
          <Container
            style={{
              width: "100%",
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#ffffff",
              border: `1px solid ${B.cardBorder}`,
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,91,172,0.08)"
            }}
          >
            <Section
              style={{
                backgroundColor: B.headerStrip,
                padding: "20px 26px 18px",
                borderBottom: `1px solid ${B.rule}`
              }}
            >
              <Row>
                {logoUrl ? (
                  <Column style={{ width: 88, verticalAlign: "top", paddingRight: 16 }}>
                    <Section
                      style={{
                        backgroundColor: "#ffffff",
                        border: `1px solid ${B.rule}`,
                        borderRadius: 8,
                        padding: "8px",
                        textAlign: "center"
                      }}
                    >
                      <Img
                        src={logoUrl}
                        width={56}
                        height={56}
                        alt="Logo UTC"
                        style={{
                          display: "block",
                          margin: "0 auto",
                          width: 56,
                          height: 56,
                          backgroundColor: "#ffffff",
                          border: 0
                        }}
                      />
                    </Section>
                  </Column>
                ) : null}
                <Column style={{ verticalAlign: "top" }}>
                  <Text
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: B.headerKicker,
                      lineHeight: "1.4"
                    }}
                  >
                    Bộ Giáo dục và Đào tạo
                  </Text>
                  <Text style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: B.headerTitle, lineHeight: "1.35" }}>
                    {SCHOOL_FULL_NAME}
                  </Text>
                  <Text style={{ margin: 0, fontSize: 13, fontWeight: 600, color: B.headerSubtitle, lineHeight: "1.5" }}>
                    Phòng Đào tạo · {MAIL_PRODUCT_NAME}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section
              style={{
                width: "100%",
                maxWidth: 600,
                boxSizing: "border-box",
                backgroundColor: B.contentBg,
                padding: "26px 28px 30px",
                fontSize: 15,
                lineHeight: "1.8",
                color: B.contentText,
                textAlign: "justify",
                wordBreak: "break-word"
              }}
            >
              {children}
            </Section>
            <Hr style={{ borderColor: B.rule, borderWidth: 1, margin: 0 }} />
            <Section
              style={{
                backgroundColor: B.footerStrip,
                padding: "18px 28px 16px",
                lineHeight: "1.65",
                textAlign: "justify",
                wordBreak: "break-word"
              }}
            >
              <Text
                style={{
                  margin: "0 0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: B.headerKicker,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  lineHeight: "1.4"
                }}
              >
                Thông tin liên hệ
              </Text>
              <Text style={{ margin: "0 0 8px", fontSize: 13, color: B.text, lineHeight: "1.7" }}>
                <span style={{ color: B.muted }}>Địa chỉ · </span>
                {ENTERPRISE_MAIL_SIGN_OFF_ADDRESS}
              </Text>
              <Text style={{ margin: "0 0 8px", fontSize: 13, color: B.text, lineHeight: "1.7" }}>
                <span style={{ color: B.muted }}>Điện thoại · </span>
                <strong style={{ color: B.headerTitle }}>{SCHOOL_HOTLINE}</strong>
              </Text>
              <Text style={{ margin: "0 0 8px", fontSize: 13, color: B.text, lineHeight: "1.7" }}>
                <span style={{ color: B.muted }}>Email · </span>
                <Link href={`mailto:${DEFAULT_SUPPORT_EMAIL}`} style={{ color: B.link, textDecoration: "underline" }}>
                  {DEFAULT_SUPPORT_EMAIL}
                </Link>
              </Text>
              <Text style={{ margin: 0, fontSize: 13, color: B.text, lineHeight: "1.7" }}>
                <span style={{ color: B.muted }}>Website · </span>
                <Link href={SCHOOL_WEBSITE} style={{ color: B.link, textDecoration: "underline" }}>
                  {SCHOOL_WEBSITE}
                </Link>
              </Text>
            </Section>
            <Section
              style={{
                backgroundColor: B.footerNote,
                padding: "14px 28px 16px",
                borderTop: `1px solid ${B.rule}`,
                lineHeight: "1.65",
                textAlign: "justify",
                wordBreak: "break-word"
              }}
            >
              <Text style={{ margin: "0 0 8px", fontSize: 12, color: B.muted, lineHeight: "1.6" }}>
                Thư được gửi tự động từ <strong style={{ color: B.text }}>{MAIL_PRODUCT_NAME}</strong>.
              </Text>
              <Text style={{ margin: 0, fontSize: 12, color: B.muted, lineHeight: "1.6" }}>
                Vui lòng không trả lời trực tiếp hộp thư này. Mọi thắc mắc xin liên hệ theo thông tin phía trên — {SCHOOL_FULL_NAME}.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
