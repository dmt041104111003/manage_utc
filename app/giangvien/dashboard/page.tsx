import styles from "../styles/dashboard.module.css";

export default function LecturerDashboardPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Giảng viên</h1>
        <p className={styles.subtitle}>Theo dõi tiến độ thực tập của sinh viên phụ trách.</p>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Sinh viên phụ trách</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Báo cáo chờ duyệt</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Lịch đánh giá tuần này</p>
          <p className={styles.value}>—</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Việc cần làm</h2>
        <ul className={styles.list}>
          <li>Chưa có dữ liệu.</li>
        </ul>
      </section>
    </main>
  );
}
