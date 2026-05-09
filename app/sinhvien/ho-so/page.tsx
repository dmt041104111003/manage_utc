"use client";

import { useEffect, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";

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

const studentDegreeLabel: Record<StudentDegree, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };
const supervisorDegreeLabel: Record<SupervisorDegree, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};
const genderLabel: Record<StudentGender, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

function formatDateVi(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function SinhVienHoSoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentAccount | null>(null);
  const [supervisor, setSupervisor] = useState<SupervisorInfo>(null);

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tài khoản</h1>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}
      {loading ? <p className={styles.modulePlaceholder}>Đang tải…</p> : null}

      {!loading && student ? (
        <>
          <section className={adminStyles.detailCard} style={{ maxWidth: "none" }}>
            <div className={adminStyles.detailSectionTitle}>Thông tin cá nhân</div>
            <table className={adminStyles.viewModalDetailTable}>
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
                  <th scope="row">SĐT</th>
                  <td>{student.phone ?? "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Email</th>
                  <td>{student.email}</td>
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
          </section>

          <section className={adminStyles.detailCard} style={{ maxWidth: "none", marginTop: 16 }}>
            <div className={adminStyles.detailSectionTitle}>Thông tin GVHD</div>
            {supervisor ? (
              <table className={adminStyles.viewModalDetailTable}>
                <tbody>
                  <tr>
                    <th scope="row">Họ tên</th>
                    <td>{supervisor.fullName}</td>
                  </tr>
                  <tr>
                    <th scope="row">Số điện thoại</th>
                    <td>{supervisor.phone ?? "—"}</td>
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
          </section>
        </>
      ) : null}
    </main>
  );
}
