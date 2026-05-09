"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import type { StudentAccount } from "@/lib/types/sinhvien-ho-so";
import { SINHVIEN_HO_SO_LOAD_ACCOUNT_ERROR_DEFAULT, SINHVIEN_HO_SO_TAI_KHOAN_ENDPOINT } from "@/lib/constants/sinhvien-ho-so";
import SinhVienAccountInfo from "../ho-so/components/SinhVienAccountInfo";

export default function SinhVienTaiKhoanCaNhanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentAccount | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(SINHVIEN_HO_SO_TAI_KHOAN_ENDPOINT);
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_HO_SO_LOAD_ACCOUNT_ERROR_DEFAULT);
        if (!cancelled) setStudent((data.student ?? null) as StudentAccount | null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || SINHVIEN_HO_SO_LOAD_ACCOUNT_ERROR_DEFAULT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tài khoản cá nhân</h1>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}
      {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}

      {!loading && student ? (
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
          <SinhVienAccountInfo student={student} />
        </section>
      ) : null}
    </main>
  );
}

