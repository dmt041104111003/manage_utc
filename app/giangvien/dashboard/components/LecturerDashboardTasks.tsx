import type { LecturerDashboardItem } from "@/lib/types/giangvien-dashboard";
import {
  GIANGVIEN_DASHBOARD_TASKS_EMPTY,
  GIANGVIEN_DASHBOARD_TASKS_LOADING
} from "@/lib/constants/giangvien-dashboard";
import styles from "../../styles/dashboard.module.css";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";

type Props = {
  loading: boolean;
  data: LecturerDashboardItem | null;
};

export default function LecturerDashboardTasks({ loading, data }: Props) {
  if (loading) {
    return (
      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Việc cần làm</h2>
        <ChartStyleLoading variant="block" message={GIANGVIEN_DASHBOARD_TASKS_LOADING} />
      </section>
    );
  }

  const tasks = data?.tasks?.length ? data.tasks : [GIANGVIEN_DASHBOARD_TASKS_EMPTY];

  return (
    <section className={styles.card}>
      <h2 className={styles.panelTitle}>Việc cần làm</h2>
      <ul className={styles.list}>
        {tasks.map((task, idx) => (
          <li key={`${task}-${idx}`}>{task}</li>
        ))}
      </ul>
    </section>
  );
}
