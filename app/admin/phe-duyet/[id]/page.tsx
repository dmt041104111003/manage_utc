"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "../../styles/dashboard.module.css";
import { PheDuyetDetailBody } from "../../components/PheDuyetDetailBody";
import { usePendingEnterpriseDetail } from "@/hooks/usePendingEnterpriseDetail";

export default function AdminPheDuyetDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { item, loading, error } = usePendingEnterpriseDetail(id);

  return (
    <main className={styles.page}>
      <p className={styles.backToTable}>
        <Link href="/admin/phe-duyet">← Quay lại danh sách phê duyệt</Link>
      </p>

      <header className={styles.header}>
        <h1 className={styles.title}>Chi tiết hồ sơ chờ phê duyệt</h1>
        <p className={styles.subtitle}>
          Mã hồ sơ: <code className={styles.monoId}>{id || "—"}</code>
        </p>
      </header>

      {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && item ? <PheDuyetDetailBody item={item} /> : null}
    </main>
  );
}
