import styles from "../styles/dashboard.module.css";

export default function AdminDashboardPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Quản trị</h1>
        <p className={styles.subtitle}>Tổng quan hệ thống quản lý thực tập của nhà trường.</p>
      </header>

      <section className={styles.kpiGrid}>
        <article className={styles.card}>
          <p className={styles.label}>Doanh nghiệp chờ duyệt</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Tin tuyển dụng đang mở</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Sinh viên đang thực tập</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Báo cáo tuần cần xử lý</p>
          <p className={styles.value}>—</p>
        </article>
      </section>

      <section className={styles.panelGrid}>
        <article className={styles.card}>
          <h2 className={styles.panelTitle}>Công việc ưu tiên hôm nay</h2>
          <ul className={styles.list}>
            <li>Chưa có dữ liệu.</li>
          </ul>
        </article>
        <article className={styles.card}>
          <h2 className={styles.panelTitle}>Thông báo hệ thống</h2>
          <ul className={styles.list}>
            <li>Chưa có thông báo.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
