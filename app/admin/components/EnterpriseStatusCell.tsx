 "use client";

import type { EnterpriseStatus } from "@prisma/client";
import { formatAdminEnterpriseStatusWithLock } from "@/lib/utils/admin-enterprise-display";
import styles from "../styles/dashboard.module.css";

type Props = { status: EnterpriseStatus | null | undefined; isLocked?: boolean | null | undefined };

export function EnterpriseStatusCell({ status, isLocked }: Props) {
  return (
    <span className={styles.statusTextPlain}>
      {formatAdminEnterpriseStatusWithLock({ enterpriseStatus: status, isLocked })}
    </span>
  );
}
