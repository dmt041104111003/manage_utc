"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import type { ApiResponse, EnterpriseAccountFormState } from "@/lib/types/doanhnghiep-tai-khoan";
import {
  ENTERPRISE_ACCOUNT_EMPTY_FORM,
  ENTERPRISE_ACCOUNT_LOAD_ERROR_DEFAULT,
  ENTERPRISE_ACCOUNT_ME_ENDPOINT,
  ENTERPRISE_ACCOUNT_NOT_FOUND_ERROR_DEFAULT,
  ENTERPRISE_ACCOUNT_SUBMIT_ERROR_DEFAULT,
  ENTERPRISE_ACCOUNT_SUBMIT_SUCCESS_DEFAULT
} from "@/lib/constants/doanhnghiep-tai-khoan";
import {
  buildEnterpriseHeadquartersAddress,
  dataUrlFromBase64
} from "@/lib/utils/enterprise-admin-display";
import { metaRecord } from "@/lib/utils/enterprise-meta";
import { formatAdminEnterpriseStatusLine } from "@/lib/utils/admin-enterprise-display";
import { buildCloudinaryImageDeliveryUrl, buildCloudinaryRawDeliveryUrl, fromCloudinaryRef } from "@/lib/storage/cloudinary";
import {
  buildEnterpriseAccountPatchPayload,
  mapEnterpriseAccountFormFromMe,
  validateEnterpriseAccountForm
} from "@/lib/utils/doanhnghiep-tai-khoan";
import EnterpriseProfileInfo from "./components/EnterpriseProfileInfo";
import EnterpriseAccountEditSection from "./components/EnterpriseAccountEditSection";

type FormState = EnterpriseAccountFormState;

export default function EnterpriseAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const dismissToast = () => setToast("");
  const dismissErrorToast = () => setError("");

  const [me, setMe] = useState<AdminEnterpriseDetail | null>(null);
  const [form, setForm] = useState<FormState>(ENTERPRISE_ACCOUNT_EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(ENTERPRISE_ACCOUNT_ME_ENDPOINT);
        const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
        if (!res.ok || !data.success) throw new Error(data.message || ENTERPRISE_ACCOUNT_LOAD_ERROR_DEFAULT);
        if (cancelled) return;
        if (!data.item) throw new Error(ENTERPRISE_ACCOUNT_NOT_FOUND_ERROR_DEFAULT);
        setMe(data.item);
        setForm(mapEnterpriseAccountFormFromMe(data.item));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : ENTERPRISE_ACCOUNT_LOAD_ERROR_DEFAULT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const { isValid, errors } = validateEnterpriseAccountForm(form);
    setFieldErrors(errors);
    return isValid;
  };

  const submit = async () => {
    if (!isEditing) return;
    setToast("");
    setError("");
    if (!validate()) return;
    try {
      setSaving(true);
      const res = await fetch("/api/doanhnghiep/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildEnterpriseAccountPatchPayload(form)
        })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || ENTERPRISE_ACCOUNT_SUBMIT_ERROR_DEFAULT);
      setToast(data.message || ENTERPRISE_ACCOUNT_SUBMIT_SUCCESS_DEFAULT);
      await reloadMe();
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : ENTERPRISE_ACCOUNT_SUBMIT_ERROR_DEFAULT);
    } finally {
      setSaving(false);
    }
  };

  const reloadMe = async () => {
    const res = await fetch(ENTERPRISE_ACCOUNT_ME_ENDPOINT);
    const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
    if (res.ok && data.success && data.item) {
      setMe(data.item);
      setForm(mapEnterpriseAccountFormFromMe(data.item));
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      </main>
    );
  }

  if (!me) return null;

  const m = metaRecord(me.enterpriseMeta);
  const address = buildEnterpriseHeadquartersAddress(me.enterpriseMeta);

  const licName = typeof m.businessLicenseName === "string" && m.businessLicenseName.trim() ? m.businessLicenseName : "—";
  const licMime = typeof m.businessLicenseMime === "string" ? m.businessLicenseMime : "application/octet-stream";
  const licB64 = typeof m.businessLicenseBase64 === "string" ? m.businessLicenseBase64 : null;
  const licPublicId = fromCloudinaryRef(typeof m.businessLicensePublicId === "string" ? m.businessLicensePublicId : null);
  const licHref = licPublicId
    ? buildCloudinaryRawDeliveryUrl(licPublicId)
    : licB64
      ? dataUrlFromBase64(licMime, licB64)
      : null;

  const logoMime = typeof m.companyLogoMime === "string" ? m.companyLogoMime : "";
  const logoB64 = typeof m.companyLogoBase64 === "string" ? m.companyLogoBase64 : null;
  const logoPublicId = fromCloudinaryRef(typeof m.companyLogoPublicId === "string" ? m.companyLogoPublicId : null);
  const logoSrc = logoPublicId
    ? buildCloudinaryImageDeliveryUrl(logoPublicId)
    : logoB64 && logoMime.startsWith("image/")
      ? dataUrlFromBase64(logoMime, logoB64)
      : null;

  const statusText = formatAdminEnterpriseStatusLine(me.enterpriseStatus);

  const startEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm(mapEnterpriseAccountFormFromMe(me));
    setFieldErrors({});
    setIsEditing(false);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tài khoản</h1>
        <p className={styles.subtitle}>Xem toàn bộ thông tin hồ sơ. Chỉ một số trường được phép chỉnh sửa.</p>
      </header>

      {toast ? <MessagePopup open message={toast} onClose={dismissToast} /> : null}
      {error ? <MessagePopup open message={error} onClose={dismissErrorToast} /> : null}

      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <h2 className={styles.panelTitle}>Thông tin hồ sơ</h2>

          <EnterpriseProfileInfo
            me={me}
            address={address}
            licName={licName}
            licHref={licHref}
            logoSrc={logoSrc}
            statusText={statusText}
          />

          <div style={{ marginTop: 20 }}>
            <EnterpriseAccountEditSection
              isEditing={isEditing}
              saving={saving}
              form={form}
              fieldErrors={fieldErrors}
              onSetField={setField}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
            />
          </div>
        </section>
      </form>
    </main>
  );
}

