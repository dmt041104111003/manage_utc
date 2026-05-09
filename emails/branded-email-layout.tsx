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
        <Section style={{ padding: "28px 14px 36px" }}>
          <Container
            style={{
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#ffffff",
              border: `1px solid ${B.cardBorder}`,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(15,23,42,0.06)"
            }}
          >
            <Row>
              <Column style={{ height: 3, backgroundColor: B.accentBar, lineHeight: 0, fontSize: 0 }}>&nbsp;</Column>
            </Row>
            <Section
              style={{
                backgroundColor: B.headerStrip,
                padding: "18px 26px 16px",
                borderBottom: `1px solid ${B.rule}`
              }}
            >
              <Row>
                {logoUrl ? (
                  <Column style={{ width: 78, verticalAlign: "top", paddingRight: 14 }}>
                    <Img
                      src={logoUrl}
                      width={64}
                      height={64}
                      alt="Logo UTC"
                      style={{ display: "block", borderRadius: 6, border: `1px solid ${B.rule}` }}
                    />
                  </Column>
                ) : null}
                <Column style={{ verticalAlign: "top" }}>
                  <Text
                    style={{
                      margin: "0 0 4px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: B.headerKicker
                    }}
                  >
                    Bộ Giáo dục và Đào tạo
                  </Text>
                  <Text style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: B.headerTitle, lineHeight: 1.3 }}>
                    {SCHOOL_FULL_NAME}
                  </Text>
                  <Text style={{ margin: 0, fontSize: 12, fontWeight: 500, color: B.headerSubtitle }}>
                    Phòng Đào tạo · {MAIL_PRODUCT_NAME}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section style={{ padding: "26px 28px 22px", fontSize: 14, lineHeight: 1.75, color: B.text }}>{children}</Section>
            <Hr style={{ borderColor: B.rule, borderWidth: 1, margin: 0 }} />
            <Section style={{ backgroundColor: B.footerStrip, padding: "16px 28px 14px" }}>
              <Text style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Thông tin liên hệ
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: B.text, lineHeight: 1.75 }}>
                <span style={{ color: B.muted }}>Địa chỉ · </span>
                {ENTERPRISE_MAIL_SIGN_OFF_ADDRESS}
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: B.text }}>
                <span style={{ color: B.muted }}>Điện thoại · </span>
                <strong>{SCHOOL_HOTLINE}</strong>
              </Text>
              <Text style={{ margin: "0 0 4px", fontSize: 12, color: B.text }}>
                <span style={{ color: B.muted }}>Email · </span>
                <Link href={`mailto:${DEFAULT_SUPPORT_EMAIL}`} style={{ color: B.link, textDecoration: "underline" }}>
                  {DEFAULT_SUPPORT_EMAIL}
                </Link>
              </Text>
              <Text style={{ margin: 0, fontSize: 12, color: B.text }}>
                <span style={{ color: B.muted }}>Website · </span>
                <Link href={SCHOOL_WEBSITE} style={{ color: B.link, textDecoration: "underline" }}>
                  {SCHOOL_WEBSITE}
                </Link>
              </Text>
            </Section>
            <Section style={{ backgroundColor: B.footerNote, padding: "12px 28px 14px", borderTop: `1px solid ${B.rule}` }}>
              <Text style={{ margin: 0, fontSize: 11, color: B.muted, lineHeight: 1.55, fontStyle: "italic" }}>
                Email tự động từ {MAIL_PRODUCT_NAME} — {SCHOOL_FULL_NAME}. Vui lòng không trả lời trực tiếp thư này.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
