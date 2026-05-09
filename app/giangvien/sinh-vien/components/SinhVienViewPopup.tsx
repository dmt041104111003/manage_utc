import MessagePopup from "../../../components/MessagePopup";
import type { Row } from "@/lib/types/giangvien-sinh-vien";
import {
  degreeLabel,
  genderLabel,
  guidanceStatusLabel,
  internshipStatusLabel
} from "@/lib/constants/giangvien-sinh-vien";
import { formatDateVi } from "@/lib/utils/giangvien-sinh-vien";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  viewTarget: Row | null;
  onClose: () => void;
};

export default function SinhVienViewPopup({ viewTarget, onClose }: Props) {
  if (!viewTarget) return null;

  const isGuidanceCompleted = viewTarget.guidanceStatus === "COMPLETED";
  const isInternshipCompleted = viewTarget.internshipStatus === "COMPLETED";

  const reportFileLink =
    viewTarget.report
      ? dataUrlFromBase64(viewTarget.report.reportMime, viewTarget.report.reportBase64)
      : null;

  return (
    <MessagePopup open title="Xem chi tiết sinh viên" size="extraWide" onClose={onClose}>
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
          <tr><th scope="row">Giới tính</th><td>{genderLabel[viewTarget.gender] ?? viewTarget.gender}</td></tr>
          <tr><th scope="row">Địa chỉ thường trú</th><td>{viewTarget.permanentAddress}</td></tr>
          <tr>
            <th scope="row">Trạng thái thực tập</th>
            <td>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    viewTarget.internshipStatus === "COMPLETED"
                      ? "#dcfce7"
                      : viewTarget.internshipStatus === "DOING" || viewTarget.internshipStatus === "SELF_FINANCED"
                      ? "#dbeafe"
                      : viewTarget.internshipStatus === "REJECTED"
                      ? "#fee2e2"
                      : "#f3f4f6",
                  color:
                    viewTarget.internshipStatus === "COMPLETED"
                      ? "#16a34a"
                      : viewTarget.internshipStatus === "DOING" || viewTarget.internshipStatus === "SELF_FINANCED"
                      ? "#1d4ed8"
                      : viewTarget.internshipStatus === "REJECTED"
                      ? "#dc2626"
                      : "#374151"
                }}
              >
                {internshipStatusLabel[viewTarget.internshipStatus] ?? viewTarget.internshipStatus}
              </span>
            </td>
          </tr>
          <tr>
            <th scope="row">Trạng thái hướng dẫn</th>
            <td>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: isGuidanceCompleted ? "#dcfce7" : "#dbeafe",
                  color: isGuidanceCompleted ? "#16a34a" : "#1d4ed8"
                }}
              >
                {guidanceStatusLabel[viewTarget.guidanceStatus]}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
        {/* Lịch sử trạng thái thực tập */}
        <div>
          <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái thực tập</div>
          {viewTarget.internshipStatusHistory.length ? (
            <div className={adminStyles.tableWrap} style={{ marginTop: 8 }}>
              <table className={adminStyles.dataTable}>
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Từ</th>
                    <th>Sang</th>
                  </tr>
                </thead>
                <tbody>
                  {viewTarget.internshipStatusHistory.map((h, i) => (
                    <tr key={`ihs-${i}`}>
                      <td>{h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}</td>
                      <td>{internshipStatusLabel[h.fromStatus] ?? h.fromStatus}</td>
                      <td style={{ fontWeight: 600 }}>{internshipStatusLabel[h.toStatus] ?? h.toStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.modulePlaceholder}>Chưa có lịch sử.</p>
          )}
        </div>

        {/* Lịch sử trạng thái hướng dẫn */}
        <div>
          <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái hướng dẫn</div>
          {viewTarget.guidanceStatusHistory.length ? (
            <div className={adminStyles.tableWrap} style={{ marginTop: 8 }}>
              <table className={adminStyles.dataTable}>
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Từ</th>
                    <th>Sang</th>
                  </tr>
                </thead>
                <tbody>
                  {viewTarget.guidanceStatusHistory.map((h, i) => (
                    <tr key={`ghs-${i}`}>
                      <td>{h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}</td>
                      <td>{guidanceStatusLabel[h.fromStatus] ?? h.fromStatus}</td>
                      <td style={{ fontWeight: 600 }}>{guidanceStatusLabel[h.toStatus] ?? h.toStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.modulePlaceholder}>Chưa có lịch sử.</p>
          )}
        </div>

        {/* Kết quả thực tập – chỉ hiển thị khi đã hoàn thành hướng dẫn */}
        {isGuidanceCompleted ? (
          isInternshipCompleted ? (
            <div>
              <div className={adminStyles.detailSectionTitle}>Kết quả thực tập</div>
              <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 8 }}>
                <tbody>
                  <tr>
                    <th scope="row">Đánh giá của giảng viên hướng dẫn</th>
                    <td style={{ whiteSpace: "pre-wrap" }}>
                      {viewTarget.report?.supervisorEvaluation ?? "—"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Điểm QT (Giảng viên hướng dẫn)</th>
                    <td>{viewTarget.report?.supervisorPoint != null ? viewTarget.report.supervisorPoint : "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đánh giá của DN</th>
                    <td style={{ whiteSpace: "pre-wrap" }}>
                      {viewTarget.report?.enterpriseEvaluation ?? "—"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Điểm KTHP (DN)</th>
                    <td>{viewTarget.report?.enterprisePoint != null ? viewTarget.report.enterprisePoint : "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">File BCTT</th>
                    <td>
                      {viewTarget.report && reportFileLink ? (
                        <a
                          className={adminStyles.detailLink}
                          href={reportFileLink}
                          download={viewTarget.report.reportFileName}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {viewTarget.report.reportFileName}
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                background: "#fefce8",
                border: "1px solid #fde047",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#713f12",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              Sinh viên chưa hoàn thành thực tập.
            </div>
          )
        ) : null}
      </div>
    </MessagePopup>
  );
}
