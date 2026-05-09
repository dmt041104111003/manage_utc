import type { StudentDashboardItem } from "@/lib/types/sinhvien-dashboard";
import {
  SINHVIEN_DASHBOARD_TASKS_EMPTY,
  SINHVIEN_DASHBOARD_TASKS_LOADING
} from "@/lib/constants/sinhvien-dashboard";
import styles from "../../styles/dashboard.module.css";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";

type Props = {
  loading: boolean;
  data: StudentDashboardItem | null;
};

export default function StudentDashboardTasks({ loading, data }: Props) {
  if (loading) {
    return (
      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Nhắc việc</h2>
        <ChartStyleLoading variant="block" message={SINHVIEN_DASHBOARD_TASKS_LOADING} />
      </section>
    );
  }

  const tasks = data?.tasks?.length ? data.tasks : [SINHVIEN_DASHBOARD_TASKS_EMPTY];

  return (
    <section className={styles.card}>
      <h2 className={styles.panelTitle}>Nhắc việc</h2>
      <ul className={styles.list}>
        {tasks.map((task, idx) => (
          <li key={`${task}-${idx}`}>{task}</li>
        ))}
      </ul>
    </section>
  );
}
