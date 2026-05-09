import styles from "../styles/dashboard.module.css";

export default function GiangvienBaoCaoPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Báo cáo thực tập</h1>
        <p className={styles.subtitle}>Thu thập, duyệt báo cáo tuần / kỳ của sinh viên.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module nộp – nhận xét – duyệt báo cáo — đang triển khai.</p>
      </section>
    </main>
  );
}
