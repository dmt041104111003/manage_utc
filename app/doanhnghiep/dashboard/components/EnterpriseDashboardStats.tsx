import type { EnterpriseDashboardItem } from "@/lib/types/doanhnghiep-dashboard";
import {
  ENTERPRISE_DASHBOARD_VALUE_LOADING
} from "@/lib/constants/doanhnghiep-dashboard";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  data: EnterpriseDashboardItem | null;
};

export default function EnterpriseDashboardStats({ loading, data }: Props) {
  return (
    <section className={styles.grid}>
      <article className={styles.card}>
        <p className={styles.label}>Tin tuyển dụng đang mở</p>
        <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.openPosts ?? 0)}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Hồ sơ ứng tuyển mới</p>
        <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.newApplications ?? 0)}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Sinh viên đang tiếp nhận</p>
        <p className={styles.value}>{loading ? ENTERPRISE_DASHBOARD_VALUE_LOADING : String(data?.receivingStudents ?? 0)}</p>
      </article>
    </section>
  );
}
