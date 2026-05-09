"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";

type StudentDegree = "BACHELOR" | "ENGINEER";
type StudentGender = "MALE" | "FEMALE" | "OTHER";
type SupervisorDegree = "MASTER" | "PHD" | "ASSOC_PROF" | "PROF";

type StudentAccount = {
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: StudentDegree;
  phone: string | null;
  email: string;
  birthDate: string | null;
  gender: StudentGender;
  address: string | null;
};

type SupervisorInfo = {
  fullName: string;
  phone: string | null;
  email: string;
  gender: StudentGender | null;
  degree: SupervisorDegree | null;
} | null;

type Province = { code: number; name: string };
type Ward = { code: number; name: string };

const studentDegreeLabel: Record<StudentDegree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };
const supervisorDegreeLabel: Record<SupervisorDegree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};
const genderLabel: Record<StudentGender, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
const PHONE_PATTERN = /^\d{8,12}$/;
const CV_ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function SinhVienHoSoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [student, setStudent] = useState<StudentAccount | null>(null);
  const [supervisor, setSupervisor] = useState<SupervisorInfo>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState<any>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentProvinceCode, setCurrentProvinceCode] = useState("");
  const [currentWardCode, setCurrentWardCode] = useState("");
  const [intro, setIntro] = useState("");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvMime, setCvMime] = useState<string | null>(null);
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardLoading, setWardLoading] = useState(false);

  const syncDraftFromProfile = (p: any) => {
    setPhone(String(p?.phone || ""));
    setEmail(String(p?.email || ""));
    setCurrentProvinceCode(String(p?.currentProvinceCode || ""));
    setCurrentWardCode(String(p?.currentWardCode || ""));
    setIntro(String(p?.intro || ""));
    setCvFileName(p?.cvFileName || null);
    setCvMime(p?.cvMime || null);
    setCvBase64(p?.cvBase64 || null);
    setFieldErrors({});
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/sinhvien/tai-khoan");
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải thông tin tài khoản.");
        setStudent(data.student ?? null);
        setSupervisor(data.supervisor ?? null);
      } catch (e: any) {
        setError(e?.message || "Không thể tải thông tin tài khoản.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const res = await fetch("/api/sinhvien/ho-so-sinh-vien");
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải hồ sơ sinh viên.");
        setProfile(data.item ?? null);
        syncDraftFromProfile(data.item ?? null);
      } catch (e: any) {
        setProfileError(e?.message || "Không thể tải hồ sơ sinh viên.");
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
    const next: Record<string, string> = {};
    if (!PHONE_PATTERN.test(phone.trim())) next.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
    if (!AUTH_EMAIL_REGISTER_PATTERN.test(email.trim())) next.email = "Email không đúng định dạng (ví dụ: example@domain.com).";
    if (!currentProvinceCode) next.currentProvinceCode = "Tỉnh/thành không hợp lệ.";
    if (!currentWardCode) next.currentWardCode = "Phường/xã không hợp lệ.";
    if (!intro.trim()) next.intro = "Thư giới thiệu bản thân bắt buộc.";
    if (intro.trim().length > 3000) next.intro = "Thư giới thiệu bản thân tối đa 3000 ký tự.";
    if (!cvBase64) next.cv = "File CV đính kèm bắt buộc.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPickCv = async (file: File | null) => {
    if (!file) return;
    const payload = await readFileAsBase64Payload(file);
    if (!CV_ALLOWED.includes(payload.mime)) {
      setFieldErrors((p) => ({ ...p, cv: "Chỉ cho phép file .doc, .docx, .pdf." }));
      return;
    }
    setCvFileName(file.name);
    setCvMime(payload.mime);
    setCvBase64(payload.base64);
    setFieldErrors((p) => ({ ...p, cv: "" }));
  };

  const submitProfile = async () => {
    if (!isEditing) return;
    if (!validateProfile()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sinhvien/ho-so-sinh-vien", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim(),
          currentProvinceCode,
          currentWardCode,
          intro: intro.trim(),
          cvFileName: cvFileName || undefined,
          cvMime: cvMime || undefined,
          cvBase64: cvBase64 || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors) setFieldErrors(data.errors);
        throw new Error(data?.message || "Không thể cập nhật hồ sơ sinh viên.");
      }
      setToast(data?.message || "Cập nhật hồ sơ sinh viên thành công.");
      const ref = await fetch("/api/sinhvien/ho-so-sinh-vien");
      const refData = await ref.json();
      if (ref.ok && refData?.success) {
        setProfile(refData.item ?? null);
        syncDraftFromProfile(refData.item ?? null);
      }
      setIsEditing(false);
    } catch (e: any) {
      setToast(e?.message || "Không thể cập nhật hồ sơ sinh viên.");
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
        <h1 className={styles.title}>Tài khoản</h1>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}
      {loading || profileLoading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}
      {profileError ? <p className={adminStyles.error}>{profileError}</p> : null}

      {!loading && !profileLoading && student && profile ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitProfile();
          }}
          noValidate
        >
          <section className={styles.card} style={{ padding: "18px 22px" }}>
            <h2 className={styles.panelTitle}>Thông tin tài khoản</h2>
            <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
              <tbody>
                <tr>
                  <th scope="row">MSV</th>
                  <td>{student.msv}</td>
                </tr>
                <tr>
                  <th scope="row">Họ tên</th>
                  <td>{student.fullName}</td>
                </tr>
                <tr>
                  <th scope="row">Lớp</th>
                  <td>{student.className}</td>
                </tr>
                <tr>
                  <th scope="row">Khoa</th>
                  <td>{student.faculty}</td>
                </tr>
                <tr>
                  <th scope="row">Khóa</th>
                  <td>{student.cohort}</td>
                </tr>
                <tr>
                  <th scope="row">Bậc</th>
                  <td>{studentDegreeLabel[student.degree]}</td>
                </tr>
                <tr>
                  <th scope="row">Ngày sinh</th>
                  <td>{formatDateVi(student.birthDate)}</td>
                </tr>
                <tr>
                  <th scope="row">Giới tính</th>
                  <td>{genderLabel[student.gender]}</td>
                </tr>
                <tr>
                  <th scope="row">Địa chỉ thường trú</th>
                  <td>{student.address || "—"}</td>
                </tr>
              </tbody>
            </table>

            <h2 className={styles.panelTitle} style={{ marginTop: 20 }}>Thông tin GVHD</h2>
            {supervisor ? (
              <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
                <tbody>
                  <tr>
                    <th scope="row">Họ tên</th>
                    <td>{supervisor.fullName}</td>
                  </tr>
                  <tr>
                    <th scope="row">Số điện thoại</th>
                    <td>{supervisor.phone || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Email</th>
                    <td>{supervisor.email}</td>
                  </tr>
                  <tr>
                    <th scope="row">Giới tính</th>
                    <td>{supervisor.gender ? genderLabel[supervisor.gender] : "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Bậc</th>
                    <td>{supervisor.degree ? supervisorDegreeLabel[supervisor.degree] : "—"}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className={styles.modulePlaceholder}>Chưa được phân công GVHD.</p>
            )}

            <h2 className={styles.panelTitle} style={{ marginTop: 20 }}>Hồ sơ sinh viên</h2>
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
                    <label className={formStyles.label}>Email</label>
                    <input className={formStyles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email" disabled={saving} />
                    {fieldErrors.email ? <p className={formStyles.error}>{fieldErrors.email}</p> : null}
                  </div>
                </div>

                <div className={formStyles.grid2}>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Địa chỉ hiện tại - Tỉnh/Thành</label>
                    <select className={formStyles.select} value={currentProvinceCode} onChange={(e) => setCurrentProvinceCode(e.target.value)} disabled={saving}>
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={String(p.code)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.currentProvinceCode ? <p className={formStyles.error}>{fieldErrors.currentProvinceCode}</p> : null}
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Địa chỉ hiện tại - Phường/Xã</label>
                    <select className={formStyles.select} value={currentWardCode} onChange={(e) => setCurrentWardCode(e.target.value)} disabled={!currentProvinceCode || wardLoading || saving}>
                      <option value="">{wardLoading ? "Đang tải…" : !currentProvinceCode ? "Chọn tỉnh trước" : "Chọn phường/xã"}</option>
                      {wards.map((w) => (
                        <option key={w.code} value={String(w.code)}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.currentWardCode ? <p className={formStyles.error}>{fieldErrors.currentWardCode}</p> : null}
                  </div>
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Thư giới thiệu bản thân</label>
                  <textarea
                    className={formStyles.input}
                    style={{ minHeight: 120, resize: "vertical", paddingTop: 10, paddingBottom: 10 }}
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    placeholder="Nhập thư giới thiệu bản thân"
                    rows={5}
                    disabled={saving}
                  />
                  {fieldErrors.intro ? <p className={formStyles.error}>{fieldErrors.intro}</p> : null}
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>File CV đính kèm (.doc, .docx, .pdf)</label>
                  <input
                    className={formStyles.input}
                    type="file"
                    accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    onChange={(e) => void onPickCv(e.target.files?.[0] || null)}
                    disabled={saving}
                  />
                  {cvFileName ? (
                    <p style={{ marginTop: 6, fontSize: 13, color: "#475467" }}>
                      Đã chọn:{" "}
                      {cvBase64 && cvMime ? (
                        <a className={adminStyles.detailLink} href={dataUrlFromBase64(cvMime, cvBase64)} download={cvFileName || "cv"}>
                          {cvFileName}
                        </a>
                      ) : (
                        cvFileName
                      )}
                    </p>
                  ) : null}
                  {fieldErrors.cv ? <p className={formStyles.error}>{fieldErrors.cv}</p> : null}
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
                    <th scope="row">Email</th>
                    <td>{email || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Địa chỉ hiện tại</th>
                    <td>
                      {[profile?.currentProvinceName, profile?.currentWardName].filter(Boolean).join(" - ") || "—"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Thư giới thiệu bản thân</th>
                    <td style={{ whiteSpace: "pre-wrap" }}>{intro || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">File CV đính kèm</th>
                    <td>
                      {cvBase64 && cvMime ? (
                        <a className={adminStyles.detailLink} href={dataUrlFromBase64(cvMime, cvBase64)} download={cvFileName || "cv"}>
                          {cvFileName || "Tải CV"}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
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
