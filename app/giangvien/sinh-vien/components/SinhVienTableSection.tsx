import type { Row } from "@/lib/types/giangvien-sinh-vien";
import { GIANGVIEN_SINH_VIEN_EMPTY_TEXT, degreeLabel } from "@/lib/constants/giangvien-sinh-vien";
import TableIconButton from "../../../components/TableIconButton";
import { FiEye } from "react-icons/fi";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  items: Row[];
  onView: (r: Row) => void;
};

export default function SinhVienTableSection({ loading, items, onView }: Props) {
  if (loading && items.length === 0) {
    return <p className={styles.modulePlaceholder}>Đang tải…</p>;
  }

  return (
    <div className={adminStyles.tableWrap}>
      <table className={adminStyles.dataTable}>
        <thead>
          <tr>
            <th>STT</th>
            <th>MSV</th>
            <th>Họ tên</th>
            <th>Khóa</th>
            <th>Bậc</th>
            <th>Trạng thái hướng dẫn</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.modulePlaceholder}>{GIANGVIEN_SINH_VIEN_EMPTY_TEXT}</td>
            </tr>
          ) : (
            items.map((r) => (
              <tr key={r.id}>
                <td data-label="STT">{r.stt}</td>
                <td data-label="MSV">{r.msv}</td>
                <td data-label="Họ tên">{r.fullName}</td>
                <td data-label="Khóa">{r.cohort}</td>
                <td data-label="Bậc">{degreeLabel[r.degree]}</td>
                <td data-label="Trạng thái hướng dẫn">{r.guidanceStatusLabel}</td>
                <td data-label="Thao tác">
                  <TableIconButton label="Xem chi tiết sinh viên" onClick={() => onView(r)}>
                    <FiEye size={18} />
                  </TableIconButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
