"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/forgot-password.module.css";
import {
  getResetPasswordRedirectPath,
  getResetPasswordSubmitErrorMessage,
  getResetPasswordSuccessMessage,
  mapResetPasswordApiError,
  validateResetPasswordForm
} from "@/lib/utils/auth/reset-password";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const resetToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewPasswordError("");
    setConfirmPasswordError("");
    setSubmitError("");
    setSuccessMessage("");

    const validation = validateResetPasswordForm({ newPassword, confirmPassword, resetToken });
    if (!validation.isValid) {
      if (validation.errors.newPassword) setNewPasswordError(validation.errors.newPassword);
      if (validation.errors.confirmPassword) setConfirmPasswordError(validation.errors.confirmPassword);
      if (validation.errors.submitError) setSubmitError(validation.errors.submitError);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token: resetToken,
          newPassword,
          confirmPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const mapped = mapResetPasswordApiError({ code: data.code, message: data.message });
        if (mapped.newPasswordError !== undefined) setNewPasswordError(mapped.newPasswordError);
        if (mapped.confirmPasswordError !== undefined) setConfirmPasswordError(mapped.confirmPasswordError);
        if (mapped.submitError !== undefined) setSubmitError(mapped.submitError);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(getResetPasswordSuccessMessage({ responseMessage: data.message }));
      setIsSubmitting(false);
      setTimeout(() => {
        router.replace(getResetPasswordRedirectPath({ redirectPath: data.redirectPath }));
      }, 1200);
    } catch {
      setSubmitError(getResetPasswordSubmitErrorMessage());
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h2 className={styles.title}>Đặt lại mật khẩu</h2>
      <p className={styles.desc}>Thiết lập mật khẩu mới cho tài khoản của bạn.</p>
      <p className={styles.hint}>Email: {email || "Không xác định"}</p>

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
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
            onChange={(event) => setNewPassword(event.target.value)}
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
            onChange={(event) => setConfirmPassword(event.target.value)}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <h2 className={styles.title}>Đặt lại mật khẩu</h2>
          <p className={styles.desc}>Đang tải…</p>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
