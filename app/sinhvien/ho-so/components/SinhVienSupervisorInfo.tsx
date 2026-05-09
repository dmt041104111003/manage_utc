import type { SupervisorInfo } from "@/lib/types/sinhvien-ho-so";
import { genderLabel, supervisorDegreeLabel } from "@/lib/constants/sinhvien-ho-so";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  supervisor: SupervisorInfo;
};

export default function SinhVienSupervisorInfo({ supervisor }: Props) {
  if (!supervisor) {
    return <p className={styles.modulePlaceholder}>Chưa được phân công GVHD.</p>;
  }

  return (
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
          <td>{supervisor.gender ? genderLabel[supervisor.gender as keyof typeof genderLabel] : "—"}</td>
        </tr>
        <tr>
          <th scope="row">Bậc</th>
          <td>{supervisor.degree ? supervisorDegreeLabel[supervisor.degree as keyof typeof supervisorDegreeLabel] : "—"}</td>
        </tr>
      </tbody>
    </table>
  );
}
