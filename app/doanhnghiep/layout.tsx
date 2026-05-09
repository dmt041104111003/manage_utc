import type { ReactNode } from "react";
import { getDashboardSidebarDisplayName } from "@/lib/auth/dashboard-display-name";
import { DashboardShell } from "../components/DashboardShell";

export default async function DoanhnghiepLayout({ children }: { children: ReactNode }) {
  const brandName = await getDashboardSidebarDisplayName();
  return (
    <DashboardShell role="doanhnghiep" brandName={brandName}>
      {children}
    </DashboardShell>
  );
}
