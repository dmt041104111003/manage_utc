import Link from "next/link";
import styles from "../../styles/login.module.css";

export default function LoginLeftPanel() {
  return (
    <section className={styles.left}>
      <div className={styles.overlay} />
      <Link href="/" replace className={styles.backToHomeBanner}>
        ← Trở lại trang chủ
      </Link>
      <div className={styles.leftContent}>
        <h1 className={styles.leftTitle}>
          Cổng thông tin quản lý giáo dục
          <br />
          Bộ Giáo dục và Đào tạo
        </h1>
        <p className={styles.leftDesc}>
          Nền tảng hỗ trợ quản lý học tập, giảng dạy và kết nối sinh viên, giảng viên, doanh nghiệp trong hệ sinh thái
          số giáo dục.
        </p>
      </div>
    </section>
  );
}
