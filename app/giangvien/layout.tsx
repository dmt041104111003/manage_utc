import type { ReactNode } from "react";
import { getDashboardSidebarDisplayName } from "@/lib/auth/dashboard-display-name";
import { DashboardShell } from "../components/DashboardShell";

export default async function GiangvienLayout({ children }: { children: ReactNode }) {
  const brandName = await getDashboardSidebarDisplayName();
  return (
    <DashboardShell role="giangvien" brandName={brandName}>
      {children}
    </DashboardShell>
  );
}
