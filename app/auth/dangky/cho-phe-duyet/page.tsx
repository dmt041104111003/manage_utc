"use client";

import Link from "next/link";
import { AuthShell } from "../../components/AuthShell";
import styles from "../../styles/register.module.css";
import { DOANHNGHIEP_CHO_PHE_DUYET_MESSAGE } from "@/lib/constants/doanhnghiep";

export default function EnterpriseRegisterPendingPage() {
  return (
    <AuthShell variant="centeredWide">
      <h2 className={styles.title}>Chờ phê duyệt yêu cầu đăng ký doanh nghiệp</h2>
      <p className={styles.desc}>{DOANHNGHIEP_CHO_PHE_DUYET_MESSAGE}</p>
      <div className={styles.linkRow}>
        <Link href="/auth/dangnhap">Quay lại màn hình đăng nhập</Link>
      </div>
    </AuthShell>
  );
}
