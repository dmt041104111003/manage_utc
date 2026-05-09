import type { ReactNode } from "react";
import { getDashboardSidebarDisplayName } from "@/lib/auth/dashboard-display-name";
import { DashboardShell } from "../components/DashboardShell";

export default async function SinhvienLayout({ children }: { children: ReactNode }) {
  const brandName = await getDashboardSidebarDisplayName();
  return (
    <DashboardShell role="sinhvien" brandName={brandName}>
      {children}
    </DashboardShell>
  );
}
