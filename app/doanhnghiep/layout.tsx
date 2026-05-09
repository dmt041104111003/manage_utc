import type { ReactNode } from "react";
import { DashboardShell } from "../components/DashboardShell";

export default function DoanhnghiepLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="doanhnghiep">{children}</DashboardShell>;
}
