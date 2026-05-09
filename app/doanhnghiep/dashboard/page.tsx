import styles from "../styles/dashboard.module.css";

export default function EnterpriseDashboardPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Doanh nghiệp</h1>
        <p className={styles.subtitle}>Quản lý tin tuyển thực tập và theo dõi ứng viên sinh viên.</p>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>Tin tuyển dụng đang mở</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Hồ sơ ứng tuyển mới</p>
          <p className={styles.value}>—</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>Sinh viên đang tiếp nhận</p>
          <p className={styles.value}>—</p>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.panelTitle}>Nhiệm vụ hôm nay</h2>
        <ul className={styles.list}>
          <li>Chưa có dữ liệu.</li>
        </ul>
      </section>
    </main>
  );
}
