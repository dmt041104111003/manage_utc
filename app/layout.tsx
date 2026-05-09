import "./globals.css";
import "./data-table-responsive.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cổng thông tin giáo dục",
  description: "Hệ thống quản lý thực tập"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
