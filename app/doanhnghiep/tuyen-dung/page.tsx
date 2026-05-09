import styles from "../styles/dashboard.module.css";

export default function DoanhNghiepTuyenDungPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tin tuyển dụng</h1>
        <p className={styles.subtitle}>Đăng, chỉnh sửa và quản lý vị trí thực tập.</p>
      </header>
      <section className={styles.card}>
        <p className={styles.modulePlaceholder}>Module CRUD tin tuyển, trạng thái duyệt — đang triển khai.</p>
      </section>
    </main>
  );
}
