"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/forgot-password.module.css";
import { AUTH_STRONG_PASSWORD_PATTERN } from "@/lib/constants/auth/patterns";

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
        const data = (await res.json()) as { home?: string };
        if (typeof data.home === "string") setDashboardHome(data.home);
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

    if (!currentPassword.trim()) {
      setCurrentPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword.trim()) {
      setNewPasswordError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword === currentPassword) {
      setNewPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }
    if (!AUTH_STRONG_PASSWORD_PATTERN.test(newPassword)) {
      setNewPasswordError("Mật khẩu phải có ít nhất 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Vui lòng nhập xác nhận mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Xác nhận mật khẩu mới không trùng khớp.");
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
        if (data.code === "UNAUTHORIZED") {
          setSubmitError(data.message || "Phiên hết hạn. Vui lòng đăng nhập lại.");
        } else if (data.code === "WRONG_CURRENT") setCurrentPasswordError(data.message);
        else if (data.code === "SAME_AS_CURRENT" || data.code === "WEAK_PASSWORD") setNewPasswordError(data.message);
        else if (data.code === "CONFIRM_NOT_MATCH") setConfirmPasswordError(data.message);
        else setSubmitError(data.message || "Đổi mật khẩu thất bại.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(data.message || "Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);
    } catch {
      setSubmitError("Không thể kết nối hệ thống. Vui lòng thử lại.");
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
