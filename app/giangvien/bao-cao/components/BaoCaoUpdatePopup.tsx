import FormPopup from "../../../components/FormPopup";
import type { Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  updateTarget: Row | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function BaoCaoUpdatePopup({ updateTarget, busy, onConfirm, onCancel }: Props) {
  if (!updateTarget) return null;

  return (
    <FormPopup
      open
      title="Cập nhật trạng thái thực tập cho SV"
      size="wide"
      busy={busy}
      onClose={() => { if (!busy) onCancel(); }}
      actions={
        <>
          <button type="button" className={adminStyles.btn} disabled={busy} onClick={onCancel}>
            Hủy
          </button>
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            disabled={busy}
            onClick={onConfirm}
          >
            Xác nhận
          </button>
        </>
      }
    >
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr><th scope="row">MSV</th><td>{updateTarget.msv}</td></tr>
          <tr><th scope="row">Họ tên</th><td>{updateTarget.fullName}</td></tr>
          <tr><th scope="row">Lớp</th><td>{updateTarget.className}</td></tr>
          <tr><th scope="row">Khoa</th><td>{updateTarget.faculty}</td></tr>
          <tr><th scope="row">Khóa</th><td>{updateTarget.cohort}</td></tr>
          <tr><th scope="row">Bậc</th><td>{degreeLabel[updateTarget.degree]}</td></tr>
          <tr><th scope="row">Trạng thái hiện tại</th><td>Chưa thực tập</td></tr>
          <tr><th scope="row">Cập nhật thành</th><td>Thực tập tự túc</td></tr>
        </tbody>
      </table>
    </FormPopup>
  );
}
