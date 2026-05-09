 "use client";

import type { EnterpriseStatus } from "@prisma/client";
import { formatAdminEnterpriseStatusLine } from "@/lib/utils/admin-enterprise-display";
import styles from "../styles/dashboard.module.css";

type Props = { status: EnterpriseStatus | null | undefined };

export function EnterpriseStatusCell({ status }: Props) {
  return <span className={styles.statusTextPlain}>{formatAdminEnterpriseStatusLine(status)}</span>;
}
