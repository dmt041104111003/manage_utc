import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "../../components/AuthShell";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";
import styles from "../../styles/forgot-password.module.css";

function EyeIcon({ hidden }: { hidden: boolean }) {
  // minimalist inline SVG to avoid new deps
  if (hidden) {
    return (
      <svg className={styles.togglePasswordIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.6 10.6a3 3 0 004.24 4.24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6.4 6.4C4.6 7.7 3.2 9.5 2.3 12c1.6 4.3 5.4 7.5 9.7 7.5 1.7 0 3.4-.5 4.9-1.4M12 4.5c4.3 0 8.1 3.2 9.7 7.5-.6 1.7-1.6 3.2-2.8 4.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={styles.togglePasswordIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.3 12C3.9 7.7 7.7 4.5 12 4.5s8.1 3.2 9.7 7.5c-1.6 4.3-5.4 7.5-9.7 7.5S3.9 16.3 2.3 12z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ResetPasswordFallback() {
  return (
    <AuthShell>
      <h2 className={styles.title}>Đặt lại mật khẩu</h2>
      <div className={styles.desc}>
        <ChartStyleLoading variant="compact" />
      </div>
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

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            type={showNewPassword ? "text" : "password"}
            className={`${styles.input} ${styles.inputWithToggle}`}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className={styles.togglePasswordBtn}
            onClick={() => setShowNewPassword((s) => !s)}
            disabled={isSubmitting}
            aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
          >
            <EyeIcon hidden={!showNewPassword} />
          </button>
          {newPasswordError ? <p className={styles.error}>{newPasswordError}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Xác nhận mật khẩu mới <span className={styles.required}>*</span>
          </label>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className={`${styles.input} ${styles.inputWithToggle}`}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className={styles.togglePasswordBtn}
            onClick={() => setShowConfirmPassword((s) => !s)}
            disabled={isSubmitting}
            aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
          >
            <EyeIcon hidden={!showConfirmPassword} />
          </button>
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
