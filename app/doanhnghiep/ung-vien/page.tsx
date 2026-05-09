import styles from "../styles/dashboard.module.css";

export default function DoanhNghiepUngVienPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ứng viên</h1>
        <p className={styles.subtitle}>Hồ sơ sinh viên ứng tuyển và trao đổi với nhà trường.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module lọc, xem chi tiết, chấp nhận / từ chối — đang triển khai.</p>
      </section>
    </main>
  );
}
