import styles from "../styles/dashboard.module.css";

export default function GiangvienSinhVienPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sinh viên hướng dẫn</h1>
        <p className={styles.subtitle}>Danh sách, trạng thái thực tập và nhật ký công việc của sinh viên.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module quản lý từng sinh viên theo lớp / đợt — đang triển khai.</p>
      </section>
    </main>
  );
}
