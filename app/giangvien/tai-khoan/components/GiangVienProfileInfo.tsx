import type { GiangVienMe } from "@/lib/types/giangvien-tai-khoan";
import { genderLabel } from "@/lib/constants/giangvien-tai-khoan";
import { formatDateVi } from "@/lib/utils/giangvien-tai-khoan";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  me: GiangVienMe;
};

export default function GiangVienProfileInfo({ me }: Props) {
  return (
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
  );
}
