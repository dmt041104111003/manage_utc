"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type { Degree, GiangVienMe, Province, Ward } from "@/lib/types/giangvien-tai-khoan";
import {
  GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE,
  GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT,
  GIANGVIEN_TAI_KHOAN_NETWORK_ERROR_DEFAULT,
  GIANGVIEN_TAI_KHOAN_SUBMIT_SUCCESS_DEFAULT
} from "@/lib/constants/giangvien-tai-khoan";
import {
  buildGiangVienTaiKhoanDraftFromMe,
  buildGiangVienTaiKhoanPatchPayload,
  validateGiangVienTaiKhoanForm
} from "@/lib/utils/giangvien-tai-khoan";
import { getCachedValue, getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import GiangVienProfileInfo from "./components/GiangVienProfileInfo";
import GiangVienAccountEditSection from "./components/GiangVienAccountEditSection";

const GV_TAI_KHOAN_CACHE_KEY = "gv:tai-khoan:me";

export default function GiangVienTaiKhoanPage() {
  const [loading, setLoading] = useState(() => !hasCachedValue(GV_TAI_KHOAN_CACHE_KEY));
  const [me, setMe] = useState<GiangVienMe | null>(() => getCachedValue<{ item?: GiangVienMe | null }>(GV_TAI_KHOAN_CACHE_KEY)?.item ?? null);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [phone, setPhone] = useState("");
  const [degree, setDegree] = useState<Degree>(GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardLoading, setWardLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dismissToast = () => setToast("");
  const dismissError = () => setError("");

  const syncDraftFromMe = (item: GiangVienMe) => {
    const draft = buildGiangVienTaiKhoanDraftFromMe(item);
    setPhone(draft.phone);
    setDegree(draft.degree);
    setProvinceCode(draft.provinceCode);
    setWardCode(draft.wardCode);
    setFieldErrors({});
  };

  async function load(opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      if (!silent && !hasCachedValue(GV_TAI_KHOAN_CACHE_KEY)) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        GV_TAI_KHOAN_CACHE_KEY,
        async () => {
          const res = await fetch("/api/giangvien/me");
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT);
          return payload;
        },
        { force }
      );
      setMe(data.item ?? null);
      if (data.item) syncDraftFromMe(data.item as GiangVienMe);
    } catch (e: any) {
      setError(e?.message || GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/vn-address/provinces");
        const data = await res.json();
        if (res.ok && Array.isArray(data?.items)) setProvinces(data.items);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    setWardLoading(true);
    fetch(`/api/vn-address/provinces/${provinceCode}/wards`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.items)) setWards(data.items);
      })
      .finally(() => setWardLoading(false));
  }, [provinceCode]);

  const validate = () => {
    const { isValid, errors } = validateGiangVienTaiKhoanForm({
      phone,
      degree,
      provinceCode,
      wardCode
    });
    setFieldErrors(errors);
    return isValid;
  };

  async function submit() {
    if (!me) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/giangvien/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildGiangVienTaiKhoanPatchPayload({ phone, degree, provinceCode, wardCode })
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || GIANGVIEN_TAI_KHOAN_NETWORK_ERROR_DEFAULT);
      setToast(data?.message || GIANGVIEN_TAI_KHOAN_SUBMIT_SUCCESS_DEFAULT);
      setIsEditing(false);
      await load({ force: true });
    } catch (e: any) {
      setError(e?.message || GIANGVIEN_TAI_KHOAN_NETWORK_ERROR_DEFAULT);
    } finally {
      setSaving(false);
    }
  }

  const startEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (!me) return;
    syncDraftFromMe(me);
    setFieldErrors({});
    setIsEditing(false);
  };

  if (loading && !me) return <main className={styles.page}><p className={styles.modulePlaceholder}>Đang tải…</p></main>;
  if (!me) return <main className={styles.page} />;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tài khoản GV</h1>
        <p className={styles.subtitle}>Thông tin tài khoản giảng viên. Chỉ cho phép chỉnh sửa SĐT, Bậc và địa chỉ thường trú.</p>
      </header>

      {toast ? (
        <MessagePopup
          open
          title="Thông báo"
          onClose={() => setToast("")}
          actions={
            <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => setToast("")}>
              Đóng
            </button>
          }
        >
          {toast}
        </MessagePopup>
      ) : null}
      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isEditing) return;
          void submit();
        }}
        noValidate
      >
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <h2 className={styles.panelTitle}>Thông tin tài khoản</h2>
          <GiangVienProfileInfo me={me} />

          <h2 className={styles.panelTitle} style={{ marginTop: 20 }}>Thông tin được phép cập nhật</h2>
          <GiangVienAccountEditSection
            me={me}
            isEditing={isEditing}
            saving={saving}
            phone={phone}
            degree={degree}
            provinceCode={provinceCode}
            wardCode={wardCode}
            provinces={provinces}
            wards={wards}
            wardLoading={wardLoading}
            fieldErrors={fieldErrors}
            onPhoneChange={setPhone}
            onDegreeChange={setDegree}
            onProvinceCodeChange={setProvinceCode}
            onWardCodeChange={setWardCode}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
          />
        </section>
      </form>
    </main>
  );
}

