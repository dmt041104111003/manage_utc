"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import styles from "../styles/login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIdentifierError("");
    setPasswordError("");
    setSubmitError("");
    setSuccessMessage("");

    let hasError = false;
    const idTrim = identifier.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!idTrim) {
      setIdentifierError("Vui lòng nhập email.");
      hasError = true;
    } else if (idTrim.toLowerCase() !== "admin" && !emailRegex.test(idTrim.toLowerCase())) {
      setIdentifierError("Vui lòng nhập email hợp lệ (ví dụ ten@domain.com), hoặc \"admin\".");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu.");
      hasError = true;
    }
    if (hasError) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.code === "WRONG_PASSWORD") setPasswordError(data.message);
        else if (data.code === "NOT_FOUND" || data.code === "LOCKED" || data.code === "INVALID_EMAIL")
          setIdentifierError(data.message);
        else setSubmitError(data.message || "Đăng nhập thất bại.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(data.message || "Đăng nhập thành công.");
      const nextRaw = searchParams.get("next");
      const safeNext =
        nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
      const dest = safeNext || data.redirectPath || "/";
      setTimeout(() => {
        router.replace(dest);
      }, 800);
    } catch {
      setSubmitError("Không thể kết nối hệ thống. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.left}>
        <div className={styles.overlay} />
        <Link href="/" replace className={styles.backToHomeBanner}>
          ← Trở lại trang chủ
        </Link>
        <div className={styles.leftContent}>
          <h1 className={styles.leftTitle}>
            Cổng thông tin quản lý giáo dục
            <br />
            Bộ Giáo dục và Đào tạo
          </h1>
          <p className={styles.leftDesc}>
            Nền tảng hỗ trợ quản lý học tập, giảng dạy và kết nối sinh viên, giảng viên,
            doanh nghiệp trong hệ sinh thái số giáo dục.
          </p>
        </div>
      </section>

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

          <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
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
                onChange={(event) => setIdentifier(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
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
            <Link href="/auth/quenmatkhau">Quên mật khẩu?</Link>
            <Link href="/auth/dangky">Đăng ký doanh nghiệp</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page} aria-busy="true" />}>
      <LoginForm />
    </Suspense>
  );
}
