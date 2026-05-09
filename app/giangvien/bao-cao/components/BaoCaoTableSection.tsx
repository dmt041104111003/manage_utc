import type { Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  loading: boolean;
  rows: Row[];
  busy: boolean;
  onView: (r: Row) => void;
  onUpdate: (r: Row) => void;
  onReview: (r: Row) => void;
};

export default function BaoCaoTableSection({ loading, rows, busy, onView, onUpdate, onReview }: Props) {
  if (loading) {
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
            <th>Trạng thái thực tập</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.modulePlaceholder}>
                Chưa có dữ liệu.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.studentProfileId}>
                <td data-label="STT">{idx + 1}</td>
                <td data-label="MSV">{r.msv}</td>
                <td data-label="Họ tên">{r.fullName}</td>
                <td data-label="Khóa">{r.cohort}</td>
                <td data-label="Bậc">{degreeLabel[r.degree]}</td>
                <td data-label="Trạng thái thực tập">{r.statusText}</td>
                <td data-label="Thao tác">
                  <button
                    type="button"
                    className={adminStyles.textLinkBtn}
                    onClick={() => onView(r)}
                    disabled={busy}
                  >
                    Xem chi tiết
                  </button>
                  {r.ui.canUpdateInternshipStatus ? (
                    <button
                      type="button"
                      className={adminStyles.textLinkBtn}
                      disabled={busy}
                      onClick={() => onUpdate(r)}
                    >
                      Cập nhật trạng thái thực tập
                    </button>
                  ) : null}
                  {r.ui.canReviewReport && r.report ? (
                    <button
                      type="button"
                      className={adminStyles.textLinkBtn}
                      disabled={busy}
                      onClick={() => onReview(r)}
                    >
                      Đánh giá BCTT
                    </button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
