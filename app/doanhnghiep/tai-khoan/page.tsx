"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import {
  DOANHNGHIEP_BUSINESS_FIELD_OPTIONS,
  DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN,
  DOANHNGHIEP_REGISTER_WEBSITE_PATTERN
} from "@/lib/constants/doanhnghiep";
import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import { metaRecord } from "@/lib/utils/enterprise-meta";
import {
  buildEnterpriseHeadquartersAddress,
  dataUrlFromBase64
} from "@/lib/utils/enterprise-admin-display";
import { formatAdminEnterpriseStatusLine } from "@/lib/utils/admin-enterprise-display";

type ApiResponse<T> = { success: boolean; message?: string; item?: T };

type FormState = {
  representativeName: string;
  representativeTitle: string;
  businessFields: string[];
  website: string;
};

const EMPTY_FORM: FormState = {
  representativeName: "",
  representativeTitle: "",
  businessFields: [],
  website: ""
};

export default function EnterpriseAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const dismissToast = () => setToast("");
  const dismissErrorToast = () => setError("");

  const [me, setMe] = useState<AdminEnterpriseDetail | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const syncFormFromMe = (item: AdminEnterpriseDetail) => {
    const m = metaRecord(item.enterpriseMeta);
    const representativeName =
      typeof m.representativeName === "string" && m.representativeName.trim()
        ? m.representativeName.trim()
        : item.fullName || "";

    const representativeTitle =
      typeof m.representativeTitle === "string" && m.representativeTitle.trim()
        ? m.representativeTitle.trim()
        : typeof item.representativeTitle === "string"
          ? item.representativeTitle
          : "";

    const businessFieldsRaw = Array.isArray(m.businessFields) ? m.businessFields : [];
    const businessFields = businessFieldsRaw
      .map((x) => String(x).trim())
      .filter(Boolean)
      .filter((x) => (DOANHNGHIEP_BUSINESS_FIELD_OPTIONS as readonly string[]).includes(x));

    const website = typeof m.website === "string" ? m.website.trim() : "";

    setForm({
      representativeName,
      representativeTitle,
      businessFields,
      website
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/doanhnghiep/me");
        const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
        if (!res.ok || !data.success) throw new Error(data.message || "Lỗi tải thông tin.");
        if (cancelled) return;
        if (!data.item) throw new Error("Không tìm thấy tài khoản.");
        setMe(data.item);
        syncFormFromMe(data.item);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Lỗi tải thông tin.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const businessOptions = useMemo(() => [...DOANHNGHIEP_BUSINESS_FIELD_OPTIONS], []);

  const setField = (key: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.representativeName || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(form.representativeName)) {
      next.representativeName = "Họ và tên chỉ gồm ký tự chữ, dài 1-255.";
    }
    if (!form.representativeTitle || !DOANHNGHIEP_REGISTER_LETTER_ONLY_PATTERN.test(form.representativeTitle)) {
      next.representativeTitle = "Chức vụ chỉ gồm ký tự chữ, dài 1-255.";
    }
    if (!form.businessFields.length) {
      next.businessFields = "Vui lòng chọn ít nhất 1 lĩnh vực hoạt động.";
    }
    if (form.website && !DOANHNGHIEP_REGISTER_WEBSITE_PATTERN.test(form.website.trim())) {
      next.website = "Website không đúng định dạng.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
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
          representativeName: form.representativeName.trim(),
          representativeTitle: form.representativeTitle.trim(),
          businessFields: form.businessFields,
          website: form.website.trim() ? form.website.trim() : null
        })
      });
      const data = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật thất bại.");
      setToast(data.message || "Cập nhật thành công.");
      await reloadMe();
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const reloadMe = async () => {
    const res = await fetch("/api/doanhnghiep/me");
    const data = (await res.json()) as ApiResponse<AdminEnterpriseDetail>;
    if (res.ok && data.success && data.item) {
      setMe(data.item);
      syncFormFromMe(data.item);
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
  const licHref = licB64 ? dataUrlFromBase64(licMime, licB64) : null;

  const logoMime = typeof m.companyLogoMime === "string" ? m.companyLogoMime : "";
  const logoB64 = typeof m.companyLogoBase64 === "string" ? m.companyLogoBase64 : null;
  const logoSrc = logoB64 && logoMime.startsWith("image/") ? dataUrlFromBase64(logoMime, logoB64) : null;

  const statusText = formatAdminEnterpriseStatusLine(me.enterpriseStatus);

  const startEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    syncFormFromMe(me);
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        <section className={styles.card} style={{ padding: "18px 22px" }}>
          <h2 className={styles.panelTitle}>Thông tin hồ sơ</h2>
      

          <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 12 }}>
            <tbody>
              <tr>
                <th scope="row">Tên doanh nghiệp</th>
                <td>{me.companyName || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Mã số thuế</th>
                <td>{me.taxCode || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Địa chỉ trụ sở chính</th>
                <td>{address}</td>
              </tr>
              <tr>
                <th scope="row">File giấy phép kinh doanh</th>
                <td>
                  {licHref ? (
                    <a className={adminStyles.detailLink} href={licHref} download={licName}>
                      {licName}
                    </a>
                  ) : (
                    licName
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Logo công ty</th>
                <td>{logoSrc ? <img src={logoSrc} alt="Logo công ty" className={adminStyles.previewLogo} /> : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{me.email}</td>
              </tr>
              <tr>
                <th scope="row">Số điện thoại</th>
                <td>{me.phone || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Trạng thái phê duyệt</th>
                <td>{statusText}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            {isEditing ? (
              <>
                <div className={formStyles.field}>
                <label className={formStyles.label}>Tên người đại diện</label>
                <input
                  className={formStyles.input}
                  disabled={saving}
                  value={form.representativeName}
                  onChange={(e) => setField("representativeName", e.target.value)}
                  placeholder="Nhập họ và tên"
                />
                {fieldErrors.representativeName ? <p className={formStyles.error}>{fieldErrors.representativeName}</p> : null}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Chức vụ</label>
                <input
                  className={formStyles.input}
                  disabled={saving}
                  value={form.representativeTitle}
                  onChange={(e) => setField("representativeTitle", e.target.value)}
                  placeholder="Nhập chức vụ"
                />
                {fieldErrors.representativeTitle ? <p className={formStyles.error}>{fieldErrors.representativeTitle}</p> : null}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Giới thiệu (lĩnh vực hoạt động)</label>
                <select
                  multiple
                  disabled={saving}
                  className={formStyles.multiSelect}
                  value={form.businessFields}
                  onChange={(e) => setField("businessFields", Array.from(e.target.selectedOptions).map((o) => o.value))}
                >
                  {businessOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className={formStyles.hint}>Giữ Ctrl (hoặc Cmd trên Mac) để chọn nhiều lĩnh vực.</p>
                {fieldErrors.businessFields ? <p className={formStyles.error}>{fieldErrors.businessFields}</p> : null}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Website công ty</label>
                <input
                  className={formStyles.input}
                  disabled={saving}
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="https://company.vn"
                />
                {fieldErrors.website ? <p className={formStyles.error}>{fieldErrors.website}</p> : null}
              </div>

                <div className={formStyles.section} style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
                  <button type="button" className={adminStyles.btn} onClick={cancelEdit} disabled={saving}>
                    Hủy
                  </button>
                  <button type="submit" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={saving}>
                    {saving ? "Đang cập nhật…" : "Lưu thay đổi"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <table className={adminStyles.viewModalDetailTable}>
                <tbody>
                  <tr>
                    <th scope="row">Tên người đại diện</th>
                    <td>{form.representativeName || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Chức vụ</th>
                    <td>{form.representativeTitle || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Giới thiệu (lĩnh vực hoạt động)</th>
                    <td>{form.businessFields.length ? form.businessFields.join(", ") : "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Website công ty</th>
                    <td>{form.website || "—"}</td>
                  </tr>
                </tbody>
                </table>
                <div className={formStyles.section} style={{ marginTop: 18 }}>
                  <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={startEdit}>
                    Sửa
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}

