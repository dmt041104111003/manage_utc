import type { ReactNode } from "react";
import { DashboardShell } from "../components/DashboardShell";

export default function GiangvienLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="giangvien">{children}</DashboardShell>;
}
