import type { InternshipStatus, StatusHistoryEvent } from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import { internshipStatusLabel } from "@/lib/constants/sinhvien-bao-cao-thuc-tap";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  statusHistory: StatusHistoryEvent[];
};

export default function BaoCaoThucTapStatusHistorySection({ statusHistory }: Props) {
  return (
    <section className={adminStyles.detailCard} style={{ padding: "20px 22px", marginTop: 16, maxWidth: "none" }}>
      <div className={adminStyles.detailSectionTitle}>Lịch sử thay đổi trạng thái</div>
      {statusHistory.length ? (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.dataTable}>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Từ</th>
                <th>→</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {statusHistory.map((h, idx) => (
                <tr key={`${h.at || ""}-${idx}`}>
                  <td>{h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}</td>
                  <td>{internshipStatusLabel[h.fromStatus as InternshipStatus]}</td>
                  <td> </td>
                  <td>{internshipStatusLabel[h.toStatus as InternshipStatus]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.modulePlaceholder}>Chưa có lịch sử.</p>
      )}
    </section>
  );
}
