import styles from "../styles/dashboard.module.css";

export default function AdminBaoCaoPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Báo cáo – thống kê</h1>
        <p className={styles.subtitle}>Số liệu tổng hợp thực tập, doanh nghiệp và sinh viên theo kỳ.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module biểu đồ, bảng số liệu xuất Excel/PDF — đang triển khai.</p>
      </section>
    </main>
  );
}
