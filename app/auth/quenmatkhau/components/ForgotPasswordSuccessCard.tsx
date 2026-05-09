import Link from "next/link";
import { AuthShell } from "../../components/AuthShell";
import styles from "../../styles/forgot-password.module.css";

type Props = {
  successMessage: string;
};

export default function ForgotPasswordSuccessCard({ successMessage }: Props) {
  return (
    <AuthShell>
      <h2 className={styles.title}>Yêu cầu đặt lại mật khẩu thành công</h2>
      <p className={styles.desc}>
        {successMessage} Hướng dẫn nằm trong email — mở liên kết để đặt mật khẩu mới (hiệu lực 15 phút).
      </p>
      <Link
        href="/auth/dangnhap"
        className={styles.button}
        style={{
          marginTop: 20,
          display: "block",
          textAlign: "center",
          textDecoration: "none",
          boxSizing: "border-box"
        }}
      >
        Quay lại màn hình đăng nhập
      </Link>
    </AuthShell>
  );
}
