"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type { Province, SinhVienHoSoDraft, SinhVienHoSoProfile, Ward } from "@/lib/types/sinhvien-ho-so";
import {
  SINHVIEN_HO_SO_LOAD_PROFILE_ERROR_DEFAULT,
  SINHVIEN_HO_SO_PROFILE_ENDPOINT,
  SINHVIEN_HO_SO_SUBMIT_ERROR_DEFAULT
} from "@/lib/constants/sinhvien-ho-so";
import {
  buildSinhVienHoSoPatchPayload,
  getSinhVienHoSoSubmitErrorMessage,
  getSinhVienHoSoSubmitSuccessMessage,
  isCvMimeAllowed,
  mapProfileToDraft,
  validateSinhVienHoSoDraft
} from "@/lib/utils/sinhvien-ho-so";
import SinhVienProfileEditSection from "./components/SinhVienProfileEditSection";

export default function SinhVienHoSoPage() {
  const [toast, setToast] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState<SinhVienHoSoProfile | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentProvinceCode, setCurrentProvinceCode] = useState("");
  const [currentWardCode, setCurrentWardCode] = useState("");
  const [intro, setIntro] = useState("");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvMime, setCvMime] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [removeCv, setRemoveCv] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardLoading, setWardLoading] = useState(false);

  const syncDraftFromProfile = (p: SinhVienHoSoProfile | null) => {
    const draft = mapProfileToDraft(p);
    setPhone(draft.phone);
    setEmail(draft.email);
    setCurrentProvinceCode(draft.currentProvinceCode);
    setCurrentWardCode(draft.currentWardCode);
    setIntro(draft.intro);
    setCvFileName(draft.cvFileName);
    setCvMime(draft.cvMime);
    setCvFile(null);
    setRemoveCv(false);
    setFieldErrors({});
  };

  useEffect(() => {
    void (async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const res = await fetch(SINHVIEN_HO_SO_PROFILE_ENDPOINT);
        const data = await res.json();
        if (!res.ok || !data?.success)
          throw new Error(data?.message || SINHVIEN_HO_SO_LOAD_PROFILE_ERROR_DEFAULT);
        setProfile((data.item ?? null) as SinhVienHoSoProfile | null);
        syncDraftFromProfile((data.item ?? null) as SinhVienHoSoProfile | null);
      } catch (e: any) {
        setProfileError(e?.message || SINHVIEN_HO_SO_LOAD_PROFILE_ERROR_DEFAULT);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/vn-address/provinces");
      const data = await res.json();
      if (res.ok && Array.isArray(data?.items)) setProvinces(data.items);
    })();
  }, []);

  useEffect(() => {
    if (!currentProvinceCode) {
      setWards([]);
      setCurrentWardCode("");
      return;
    }
    setWardLoading(true);
    fetch(`/api/vn-address/provinces/${currentProvinceCode}/wards`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.items)) setWards(data.items);
      })
      .finally(() => setWardLoading(false));
  }, [currentProvinceCode]);

  const validateProfile = () => {
    const draft: SinhVienHoSoDraft = {
      phone,
      email,
      currentProvinceCode,
      currentWardCode,
      intro,
      cvFileName,
      cvMime,
      cvFile
    };
    const { isValid, errors } = validateSinhVienHoSoDraft(draft);
    setFieldErrors(errors);
    return isValid;
  };

  const onPickCv = async (file: File | null) => {
    if (!file) return;
    const mime = file.type || "";
    if (!isCvMimeAllowed(mime)) {
      setFieldErrors((p) => ({ ...p, cv: "File CV không hợp lệ. Chỉ hỗ trợ .pdf, .doc, .docx." }));
      return;
    }
    setCvFileName(file.name);
    setCvMime(mime);
    setCvFile(file);
    setRemoveCv(false);
    setFieldErrors((p) => ({ ...p, cv: "" }));
  };

  const submitProfile = async () => {
    if (!isEditing) return;
    if (!validateProfile()) return;
    setSaving(true);
    try {
      const payload = buildSinhVienHoSoPatchPayload({
        phone,
        email,
        currentProvinceCode,
        currentWardCode,
        intro,
        cvFileName,
        cvMime,
        cvFile
      } as any);
      const fd = new FormData();
      fd.set("phone", payload.phone);
      fd.set("email", payload.email);
      fd.set("currentProvinceCode", payload.currentProvinceCode);
      fd.set("currentWardCode", payload.currentWardCode);
      fd.set("intro", payload.intro);
      if (cvFile) fd.set("cv", cvFile);
      if (removeCv) fd.set("removeCv", "1");

      const res = await fetch(SINHVIEN_HO_SO_PROFILE_ENDPOINT, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors) setFieldErrors(data.errors);
        throw new Error(data?.message || SINHVIEN_HO_SO_SUBMIT_ERROR_DEFAULT);
      }
      setToast(getSinhVienHoSoSubmitSuccessMessage({ message: data?.message }));
      const ref = await fetch(SINHVIEN_HO_SO_PROFILE_ENDPOINT);
      const refData = await ref.json();
      if (ref.ok && refData?.success) {
        setProfile(refData.item ?? null);
        syncDraftFromProfile(refData.item ?? null);
      }
      setIsEditing(false);
    } catch (e: any) {
      setToast(e?.message || getSinhVienHoSoSubmitErrorMessage({ message: e?.message }));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    syncDraftFromProfile(profile);
    setIsEditing(false);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hồ sơ cá nhân</h1>
      </header>

      {profileLoading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
      {profileError ? <p className={adminStyles.error}>{profileError}</p> : null}

      {!profileLoading && profile ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitProfile();
          }}
          noValidate
        >
          <section className={styles.card} style={{ padding: "18px 22px" }}>
            <h2 className={styles.panelTitle}>Hồ sơ sinh viên</h2>
            <SinhVienProfileEditSection
              isEditing={isEditing}
              saving={saving}
              profile={profile}
              phone={phone}
              email={email}
              currentProvinceCode={currentProvinceCode}
              currentWardCode={currentWardCode}
              intro={intro}
              cvFileName={cvFileName}
              cvMime={cvMime}
              provinces={provinces}
              wards={wards}
              wardLoading={wardLoading}
              fieldErrors={fieldErrors}
              onPhoneChange={setPhone}
              onEmailChange={setEmail}
              onProvinceCodeChange={setCurrentProvinceCode}
              onWardCodeChange={setCurrentWardCode}
              onIntroChange={setIntro}
              onPickCv={(f) => void onPickCv(f)}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
            />
          </section>
        </form>
      ) : null}

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
    </main>
  );
}
