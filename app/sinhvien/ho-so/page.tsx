import styles from "../styles/dashboard.module.css";

export default function SinhVienHoSoPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hồ sơ thực tập</h1>
        <p className={styles.subtitle}>Thông tin đơn vị, hợp đồng và giấy tờ liên quan.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module xem và cập nhật hồ sơ được gán — đang triển khai.</p>
      </section>
    </main>
  );
}
