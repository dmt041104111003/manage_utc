import styles from "../styles/dashboard.module.css";

export default function StudentDashboardPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Sinh viên</h1>
        <p className={styles.subtitle}>Quản lý tiến độ thực tập và theo dõi các mốc quan trọng.</p>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Trạng thái thực tập</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Báo cáo đã nộp</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Phản hồi mới</p>
          <p className={styles.value}>—</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Nhắc việc</h2>
        <ul className={styles.list}>
          <li>Chưa có dữ liệu.</li>
        </ul>
      </section>
    </main>
  );
}
