import type { StudentAccount } from "@/lib/types/sinhvien-ho-so";
import { genderLabel, studentDegreeLabel } from "@/lib/constants/sinhvien-ho-so";
import { formatDateVi } from "@/lib/utils/sinhvien-ho-so";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  student: StudentAccount;
};

export default function SinhVienAccountInfo({ student }: Props) {
  return (
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
          <td>{studentDegreeLabel[student.degree as keyof typeof studentDegreeLabel]}</td>
        </tr>
        <tr>
          <th scope="row">Ngày sinh</th>
          <td>{formatDateVi(student.birthDate)}</td>
        </tr>
        <tr>
          <th scope="row">Giới tính</th>
          <td>{genderLabel[student.gender as keyof typeof genderLabel]}</td>
        </tr>
        <tr>
          <th scope="row">Địa chỉ thường trú</th>
          <td>{student.address || "—"}</td>
        </tr>
      </tbody>
    </table>
  );
}
