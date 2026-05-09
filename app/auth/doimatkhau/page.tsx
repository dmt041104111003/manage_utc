"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/forgot-password.module.css";
import {
  getChangePasswordNetworkErrorMessage,
  getChangePasswordSuccessMessage,
  mapChangePasswordApiError,
  normalizeAuthMeResponse,
  validateChangePasswordForm
} from "@/lib/utils/auth/change-password";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardHome, setDashboardHome] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const normalized = normalizeAuthMeResponse(data);
        if (normalized.home) setDashboardHome(normalized.home);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setSubmitError("");
    setSuccessMessage("");

    const validation = validateChangePasswordForm({ currentPassword, newPassword, confirmPassword });
    if (!validation.isValid) {
      if (validation.errors.currentPassword) setCurrentPasswordError(validation.errors.currentPassword);
      if (validation.errors.newPassword) setNewPasswordError(validation.errors.newPassword);
      if (validation.errors.confirmPassword) setConfirmPasswordError(validation.errors.confirmPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await response.json();

      if (!response.ok) {
        const mapped = mapChangePasswordApiError({ code: data.code, message: data.message });
        if (mapped.currentPassword) setCurrentPasswordError(mapped.currentPassword);
        if (mapped.newPassword) setNewPasswordError(mapped.newPassword);
        if (mapped.confirmPassword) setConfirmPasswordError(mapped.confirmPassword);
        if (mapped.submitError) setSubmitError(mapped.submitError);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(getChangePasswordSuccessMessage({ responseMessage: data.message }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);
    } catch {
      setSubmitError(getChangePasswordNetworkErrorMessage());
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h2 className={styles.title}>Đổi mật khẩu</h2>
      <p className={styles.desc}>
        Bạn đã đăng nhập — nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
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
            onChange={(event) => setCurrentPassword(event.target.value)}
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
            onChange={(event) => setNewPassword(event.target.value)}
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
            onChange={(event) => setConfirmPassword(event.target.value)}
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
