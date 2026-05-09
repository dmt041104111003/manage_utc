import type { EnterpriseDashboardItem } from "@/lib/types/doanhnghiep-dashboard";
import {
  ENTERPRISE_DASHBOARD_TASKS_EMPTY,
  ENTERPRISE_DASHBOARD_TASKS_LOADING
} from "@/lib/constants/doanhnghiep-dashboard";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  data: EnterpriseDashboardItem | null;
};

export default function EnterpriseDashboardTasks({ loading, data }: Props) {
  const tasks = loading
    ? [ENTERPRISE_DASHBOARD_TASKS_LOADING]
    : data?.tasks?.length
      ? data.tasks
      : [ENTERPRISE_DASHBOARD_TASKS_EMPTY];

  return (
    <section className={styles.card}>
      <h2 className={styles.panelTitle}>Nhiệm vụ hôm nay</h2>
      <ul className={styles.list}>
        {tasks.map((task, idx) => (
          <li key={`${task}-${idx}`}>{task}</li>
        ))}
      </ul>
    </section>
  );
}
