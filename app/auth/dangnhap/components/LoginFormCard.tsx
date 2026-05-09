import Link from "next/link";
import type { FormEvent } from "react";
import styles from "../../styles/login.module.css";

type Props = {
  identifier: string;
  password: string;
  identifierError: string;
  passwordError: string;
  submitError: string;
  successMessage: string;
  isSubmitting: boolean;
  showPassword: boolean;
  showForgotPassword: boolean;
  onIdentifierChange: (value: string) => void;
  onIdentifierFocus: () => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function LoginFormCard(props: Props) {
  const {
    identifier,
    password,
    identifierError,
    passwordError,
    submitError,
    successMessage,
    isSubmitting,
    showPassword,
    showForgotPassword,
    onIdentifierChange,
    onIdentifierFocus,
    onPasswordChange,
    onTogglePassword,
    onSubmit
  } = props;

  return (
    <section className={styles.right}>
      <div className={styles.card}>
        <Link href="/" replace className={styles.backToHomeInCard}>
          ← Trở lại trang chủ
        </Link>
        <div className={styles.logoWrap}>
          <img src="/logo.png" alt="Logo Bộ Giáo dục và Đào tạo" width={72} height={72} />
        </div>

        <h2 className={styles.title}>Đăng nhập hệ thống</h2>
        <p className={styles.subtitle}>Giảng viên/Sinh viên dùng tài khoản admin cấp, doanh nghiệp vui lòng đăng ký.</p>

        <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
          <div className={styles.field}>
            <label htmlFor="identifier" className={styles.label}>
              Email đăng nhập <span className={styles.required}>*</span>
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              className={styles.input}
              placeholder="vd: ten@domain.com"
              value={identifier}
              onChange={(e) => onIdentifierChange(e.target.value)}
              onFocus={onIdentifierFocus}
              disabled={isSubmitting}
            />
            {identifierError ? <p className={styles.error}>{identifierError}</p> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu <span className={styles.required}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={styles.input}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={onTogglePassword}
              disabled={isSubmitting}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
            {passwordError ? <p className={styles.error}>{passwordError}</p> : null}
          </div>

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {submitError ? <p className={styles.errorGlobal}>{submitError}</p> : null}
        {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

        <div className={styles.links}>
          {showForgotPassword ? <Link href="/auth/quenmatkhau">Quên mật khẩu?</Link> : null}
          <Link href="/auth/dangky">Đăng ký doanh nghiệp</Link>
        </div>
      </div>
    </section>
  );
}
