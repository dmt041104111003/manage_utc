import type { StudentDashboardItem } from "@/lib/types/sinhvien-dashboard";
import { SINHVIEN_DASHBOARD_VALUE_LOADING } from "@/lib/constants/sinhvien-dashboard";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  data: StudentDashboardItem | null;
};

export default function StudentDashboardStats({ loading, data }: Props) {
  return (
    <section className={styles.grid}>
      <article className={styles.card}>
        <p className={styles.label}>Trạng thái thực tập</p>
        <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : data?.internshipStatus ?? "—"}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Báo cáo đã nộp</p>
        <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : String(data?.reportSubmittedCount ?? 0)}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Phản hồi mới</p>
        <p className={styles.value}>{loading ? SINHVIEN_DASHBOARD_VALUE_LOADING : String(data?.newFeedbackCount ?? 0)}</p>
      </article>
    </section>
  );
}
