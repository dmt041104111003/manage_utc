"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { Degree, GiangVienMe, Province, Ward } from "@/lib/types/giangvien-tai-khoan";
import {
  DEGREE_ALLOWED,
  degreeLabel,
  genderLabel,
  GIANGVIEN_TAI_KHOAN_DEFAULT_DEGREE,
  GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT,
  GIANGVIEN_TAI_KHOAN_NETWORK_ERROR_DEFAULT,
  GIANGVIEN_TAI_KHOAN_SUBMIT_SUCCESS_DEFAULT
} from "@/lib/constants/giangvien-tai-khoan";
import {
  buildGiangVienTaiKhoanDraftFromMe,
  buildGiangVienTaiKhoanPatchPayload,
  formatDateVi,
  validateGiangVienTaiKhoanForm
} from "@/lib/utils/giangvien-tai-khoan";

export default function GiangVienTaiKhoanPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<GiangVienMe | null>(null);
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

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/giangvien/me");
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT);
      setMe(data.item ?? null);
      if (data.item) syncDraftFromMe(data.item as GiangVienMe);
    } catch (e: any) {
      setError(e?.message || GIANGVIEN_TAI_KHOAN_LOAD_ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      await load();
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

  if (loading) return <main className={styles.page}><p className={styles.modulePlaceholder}>Đang tải…</p></main>;
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
          <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
            <tbody>
              <tr>
                <th scope="row">Họ tên</th>
                <td>{me.fullName}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{me.email}</td>
              </tr>
              <tr>
                <th scope="row">Ngày sinh</th>
                <td>{formatDateVi(me.birthDate)}</td>
              </tr>
              <tr>
                <th scope="row">Giới tính</th>
                <td>{genderLabel[me.gender]}</td>
              </tr>
              <tr>
                <th scope="row">Khoa</th>
                <td>{me.faculty}</td>
              </tr>
            </tbody>
          </table>

          <h2 className={styles.panelTitle} style={{ marginTop: 20 }}>Thông tin được phép cập nhật</h2>
          {isEditing ? (
            <>
              <div className={formStyles.grid2} style={{ marginTop: 8 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>SĐT</label>
                  <input
                    className={formStyles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="Nhập số điện thoại"
                    disabled={saving}
                  />
                  {fieldErrors.phone ? <p className={formStyles.error}>{fieldErrors.phone}</p> : null}
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Bậc</label>
                  <select className={formStyles.select} value={degree} onChange={(e) => setDegree(e.target.value as Degree)} disabled={saving}>
                    {DEGREE_ALLOWED.map((d) => (
                      <option key={d} value={d}>{degreeLabel[d]}</option>
                    ))}
                  </select>
                  {fieldErrors.degree ? <p className={formStyles.error}>{fieldErrors.degree}</p> : null}
                </div>
              </div>

              <div className={formStyles.grid2} style={{ marginTop: 0 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Địa chỉ thường trú - Tỉnh/Thành</label>
                  <select className={formStyles.select} value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)} disabled={saving}>
                    <option value="">Chọn tỉnh/thành</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={String(p.code)}>{p.name}</option>
                    ))}
                  </select>
                  {fieldErrors.permanentProvinceCode ? <p className={formStyles.error}>{fieldErrors.permanentProvinceCode}</p> : null}
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Địa chỉ thường trú - Phường/Xã</label>
                  <select
                    className={formStyles.select}
                    value={wardCode}
                    onChange={(e) => setWardCode(e.target.value)}
                    disabled={!provinceCode || wardLoading || saving}
                  >
                    <option value="">{wardLoading ? "Đang tải…" : !provinceCode ? "Chọn tỉnh trước" : "Chọn phường/xã"}</option>
                    {wards.map((w) => (
                      <option key={w.code} value={String(w.code)}>{w.name}</option>
                    ))}
                  </select>
                  {fieldErrors.permanentWardCode ? <p className={formStyles.error}>{fieldErrors.permanentWardCode}</p> : null}
                </div>
              </div>
            </>
          ) : (
            <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
              <tbody>
                <tr>
                  <th scope="row">SĐT</th>
                  <td>{phone || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Bậc</th>
                  <td>{degreeLabel[degree]}</td>
                </tr>
                <tr>
                  <th scope="row">Địa chỉ thường trú</th>
                  <td>{[me.permanentProvinceName, me.permanentWardName].filter(Boolean).join(" - ") || "—"}</td>
                </tr>
              </tbody>
            </table>
          )}

          {isEditing ? (
            <div className={formStyles.section} style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className={adminStyles.btn} onClick={cancelEdit} disabled={saving}>
                Hủy
              </button>
              <button type="submit" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={saving}>
                {saving ? "Đang cập nhật…" : "Cập nhật"}
              </button>
            </div>
          ) : (
            <div className={formStyles.section} style={{ marginTop: 18 }}>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={startEdit}>
                Sửa
              </button>
            </div>
          )}
        </section>
      </form>
    </main>
  );
}

