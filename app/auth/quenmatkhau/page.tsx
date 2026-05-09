"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import styles from "../styles/forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");
    setSubmitError("");

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      setEmailError("Vui lòng nhập email.");
      return;
    }
    if (!emailRegex.test(normalizedEmail)) {
      setEmailError("Email không đúng định dạng example@domain.com.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.message || "Không thể gửi yêu cầu đặt lại mật khẩu.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(data.message || "Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hòm thư.");
      setIsSubmitting(false);
    } catch {
      setSubmitError("Không thể kết nối hệ thống. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
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

  return (
    <AuthShell>
      <h2 className={styles.title}>Quên mật khẩu?</h2>
      <p className={styles.desc}>
        Nhập email đã đăng ký — hệ thống gửi liên kết đặt lại mật khẩu qua email (hiệu lực 15 phút). Mở liên kết trong
        email để thiết lập mật khẩu mới.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
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
            onChange={(event) => setEmail(event.target.value)}
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
