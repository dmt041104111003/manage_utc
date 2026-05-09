import Link from "next/link";
import type { FormEvent } from "react";
import { AuthShell } from "../../components/AuthShell";
import styles from "../../styles/forgot-password.module.css";

type Props = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  currentPasswordError: string;
  newPasswordError: string;
  confirmPasswordError: string;
  submitError: string;
  successMessage: string;
  isSubmitting: boolean;
  dashboardHome: string | null;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ChangePasswordFormCard(props: Props) {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
    currentPasswordError,
    newPasswordError,
    confirmPasswordError,
    submitError,
    successMessage,
    isSubmitting,
    dashboardHome,
    onCurrentPasswordChange,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onSubmit
  } = props;

  return (
    <AuthShell>
      <h2 className={styles.title}>Đổi mật khẩu</h2>
      <p className={styles.desc}>Bạn đã đăng nhập — nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>

      <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
        <div className={styles.field}>
          <label htmlFor="currentPassword" className={styles.label}>
            Mật khẩu hiện tại <span className={styles.required}>*</span>
          </label>
          <input
            id="currentPassword"
            type="password"
            className={styles.input}
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            disabled={isSubmitting}
          />
          {currentPasswordError ? <p className={styles.error}>{currentPasswordError}</p> : null}
        </div>

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
          <p className={styles.hint}>Mật khẩu gồm tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
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
          {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>

      {submitError ? <p className={styles.errorGlobal}>{submitError}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      {dashboardHome ? (
        <div className={styles.linkRow}>
          <Link href={dashboardHome}>Quay lại bảng điều khiển</Link>
        </div>
      ) : null}
    </AuthShell>
  );
}
