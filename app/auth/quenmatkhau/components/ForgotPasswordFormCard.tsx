import Link from "next/link";
import type { FormEvent } from "react";
import { AuthShell } from "../../components/AuthShell";
import styles from "../../styles/forgot-password.module.css";

type Props = {
  email: string;
  emailError: string;
  submitError: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ForgotPasswordFormCard({
  email,
  emailError,
  submitError,
  isSubmitting,
  onEmailChange,
  onSubmit
}: Props) {
  return (
    <AuthShell>
      <h2 className={styles.title}>Quên mật khẩu?</h2>
      <p className={styles.desc}>
        Nhập email đã đăng ký — hệ thống gửi liên kết đặt lại mật khẩu qua email (hiệu lực 15 phút). Mở liên kết trong
        email để thiết lập mật khẩu mới.
      </p>

      <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            name="email"
            className={styles.input}
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>Dùng email đã đăng ký trong hệ thống.</p>
          {emailError ? <p className={styles.error}>{emailError}</p> : null}
        </div>

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi"}
        </button>
      </form>

      {submitError ? <p className={styles.errorGlobal}>{submitError}</p> : null}

      <div className={styles.linkRow}>
        <Link href="/auth/dangnhap">Quay lại đăng nhập</Link>
      </div>
    </AuthShell>
  );
}
