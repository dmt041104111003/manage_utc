import type { LecturerDashboardItem } from "@/lib/types/giangvien-dashboard";
import { GIANGVIEN_DASHBOARD_VALUE_LOADING } from "@/lib/constants/giangvien-dashboard";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  data: LecturerDashboardItem | null;
};

export default function LecturerDashboardStats({ loading, data }: Props) {
  return (
    <section className={styles.grid}>
      <article className={styles.card}>
        <p className={styles.label}>Sinh viên phụ trách</p>
        <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.assignedStudents ?? 0)}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Báo cáo chờ duyệt</p>
        <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.pendingReports ?? 0)}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Lịch đánh giá tuần này</p>
        <p className={styles.value}>{loading ? GIANGVIEN_DASHBOARD_VALUE_LOADING : String(data?.weeklyReviews ?? 0)}</p>
      </article>
    </section>
  );
}
