import type { ReactNode } from "react";
import { DashboardShell } from "../components/DashboardShell";

export default function SinhvienLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="sinhvien">{children}</DashboardShell>;
}
