import styles from "../styles/dashboard.module.css";

export default function SinhVienNhatKyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nhật ký & báo cáo</h1>
        <p className={styles.subtitle}>Ghi nhận công việc hằng ngày và nộp báo cáo cho giảng viên.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module nhật ký + báo cáo định kỳ — đang triển khai.</p>
      </section>
    </main>
  );
}
