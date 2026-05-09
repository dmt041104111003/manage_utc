import MessagePopup from "../../../components/MessagePopup";
import type { Row } from "@/lib/types/giangvien-sinh-vien";
import { degreeLabel, guidanceStatusLabel, internshipStatusLabel } from "@/lib/constants/giangvien-sinh-vien";
import { formatDateVi } from "@/lib/utils/giangvien-sinh-vien";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  viewTarget: Row | null;
  onClose: () => void;
};

export default function SinhVienViewPopup({ viewTarget, onClose }: Props) {
  if (!viewTarget) return null;

  return (
    <MessagePopup open title="Xem chi tiết SV" size="extraWide" onClose={onClose}>
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr><th scope="row">MSV</th><td>{viewTarget.msv}</td></tr>
          <tr><th scope="row">Họ tên</th><td>{viewTarget.fullName}</td></tr>
          <tr><th scope="row">Lớp</th><td>{viewTarget.className}</td></tr>
          <tr><th scope="row">Khoa</th><td>{viewTarget.faculty}</td></tr>
          <tr><th scope="row">Khóa</th><td>{viewTarget.cohort}</td></tr>
          <tr><th scope="row">Bậc</th><td>{degreeLabel[viewTarget.degree]}</td></tr>
          <tr><th scope="row">SĐT</th><td>{viewTarget.phone ?? "—"}</td></tr>
          <tr><th scope="row">Email</th><td>{viewTarget.email}</td></tr>
          <tr><th scope="row">Ngày sinh</th><td>{formatDateVi(viewTarget.birthDate)}</td></tr>
          <tr><th scope="row">Giới tính</th><td>{viewTarget.gender}</td></tr>
          <tr><th scope="row">Địa chỉ thường trú</th><td>{viewTarget.permanentAddress}</td></tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
        <div>
          <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái thực tập</div>
          {viewTarget.internshipStatusHistory.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {viewTarget.internshipStatusHistory.map((h, i) => (
                <div key={`${h.at ?? i}-${i}`} style={{ fontSize: 13, color: "#111827" }}>
                  <span style={{ fontWeight: 600 }}>{internshipStatusLabel[h.toStatus] ?? h.toStatus}</span>
                  <span style={{ color: "#6b7280" }}>
                    {" "}- {h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.modulePlaceholder}>—</p>
          )}
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái hướng dẫn</div>
          {viewTarget.guidanceStatusHistory.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {viewTarget.guidanceStatusHistory.map((h, i) => (
                <div key={`${h.at ?? i}-${i}`} style={{ fontSize: 13, color: "#111827" }}>
                  <span style={{ fontWeight: 600 }}>{guidanceStatusLabel[h.toStatus] ?? h.toStatus}</span>
                  <span style={{ color: "#6b7280" }}>
                    {" "}- {h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.modulePlaceholder}>—</p>
          )}
        </div>
      </div>
    </MessagePopup>
  );
}
