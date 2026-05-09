/** Khóa map sang react-icons/fi trong DashboardShell */
export type DashboardNavIcon =
  | "overview"
  | "building"
  | "calendar"
  | "accounts"
  | "assign"
  | "students"
  | "instructors"
  | "documents"
  | "progress"
  | "account"
  | "report"
  | "password"
  | "search"
  | "applications"
  | "profile"
  | "candidates";

export type DashboardNavItem = { href: string; label: string; icon: DashboardNavIcon };
