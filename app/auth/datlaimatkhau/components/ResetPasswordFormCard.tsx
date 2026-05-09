import type { FormEvent } from "react";
import { AuthShell } from "../../components/AuthShell";
import styles from "../../styles/forgot-password.module.css";

export function ResetPasswordFallback() {
  return (
    <AuthShell>
      <h2 className={styles.title}>Đặt lại mật khẩu</h2>
      <p className={styles.desc}>Đang tải…</p>
    </AuthShell>
  );
}

type Props = {
  email: string;
  newPassword: string;
  confirmPassword: string;
  newPasswordError: string;
  confirmPasswordError: string;
  submitError: string;
  successMessage: string;
  isSubmitting: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ResetPasswordFormCard(props: Props) {
  const {
    email,
    newPassword,
    confirmPassword,
    newPasswordError,
    confirmPasswordError,
    submitError,
    successMessage,
    isSubmitting,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onSubmit
  } = props;

  return (
    <AuthShell>
      <h2 className={styles.title}>Đặt lại mật khẩu</h2>
      <p className={styles.desc}>Thiết lập mật khẩu mới cho tài khoản của bạn.</p>
      <p className={styles.hint}>Email: {email || "Không xác định"}</p>

      <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
        <div className={styles.field}>
          <label htmlFor="newPassword" className={styles.label}>
            Mật khẩu mới <span className={styles.required}>*</span>
          </label>
          <input
            id="newPassword"
            type="password"
            className={styles.input}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={isSubmitting}
          />
          {newPasswordError ? <p className={styles.error}>{newPasswordError}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Xác nhận mật khẩu mới <span className={styles.required}>*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.input}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={isSubmitting}
          />
          {confirmPasswordError ? <p className={styles.error}>{confirmPasswordError}</p> : null}
        </div>

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>

      {submitError ? <p className={styles.errorGlobal}>{submitError}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
    </AuthShell>
  );
}
