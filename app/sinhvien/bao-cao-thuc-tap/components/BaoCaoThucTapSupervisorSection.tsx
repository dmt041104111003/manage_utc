import type { SupervisorInfo } from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import { genderLabel, supervisorDegreeLabel } from "@/lib/constants/sinhvien-bao-cao-thuc-tap";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  supervisor: SupervisorInfo | null;
};

export default function BaoCaoThucTapSupervisorSection({ supervisor }: Props) {
  return (
    <section className={adminStyles.detailCard} style={{ padding: "20px 22px", marginTop: 16, maxWidth: "none" }}>
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
              <td>{genderLabel[supervisor.gender] ?? supervisor.gender}</td>
            </tr>
            <tr>
              <th scope="row">Bậc</th>
              <td>{supervisorDegreeLabel[supervisor.degree] ?? supervisor.degree}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className={styles.modulePlaceholder}>Chưa được phân công GVHD.</p>
      )}
    </section>
  );
}
