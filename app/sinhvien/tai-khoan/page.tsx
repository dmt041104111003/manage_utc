"use client";

import { useEffect, useState } from "react";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import type { StudentAccount } from "@/lib/types/sinhvien-ho-so";
import { SINHVIEN_HO_SO_LOAD_ACCOUNT_ERROR_DEFAULT, SINHVIEN_HO_SO_TAI_KHOAN_ENDPOINT } from "@/lib/constants/sinhvien-ho-so";
import SinhVienAccountInfo from "../ho-so/components/SinhVienAccountInfo";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";

const SV_TAI_KHOAN_CACHE_KEY = "sinhvien:tai-khoan:me";

export default function SinhVienTaiKhoanCaNhanPage() {
  const [loading, setLoading] = useState(() => !hasCachedValue(SV_TAI_KHOAN_CACHE_KEY));
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentAccount | null>(() => getCachedValue<{ student?: StudentAccount | null }>(SV_TAI_KHOAN_CACHE_KEY)?.student ?? null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!hasCachedValue(SV_TAI_KHOAN_CACHE_KEY)) setLoading(true);
        setError("");
        const data = await getOrFetchCached<{ success?: boolean; message?: string; student?: StudentAccount | null }>(
          SV_TAI_KHOAN_CACHE_KEY,
          async () => {
            const res = await fetch(SINHVIEN_HO_SO_TAI_KHOAN_ENDPOINT);
            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.message || SINHVIEN_HO_SO_LOAD_ACCOUNT_ERROR_DEFAULT);
            return json;
          }
        );
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
      {loading && !student ? <ChartStyleLoading variant="block" /> : null}

      {student ? (
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
          <SinhVienAccountInfo student={student} />
        </section>
      ) : null}
    </main>
  );
}

