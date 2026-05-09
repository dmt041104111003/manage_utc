import MessagePopup from "../../../components/MessagePopup";
import type { Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import { formatDateVi } from "@/lib/utils/giangvien-bao-cao-thuc-tap";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  viewTarget: Row | null;
  onClose: () => void;
};

export default function BaoCaoViewPopup({ viewTarget, onClose }: Props) {
  if (!viewTarget) return null;

  return (
    <MessagePopup open title="Xem chi tiết" size="extraWide" onClose={onClose}>
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
          <tr><th scope="row">Trạng thái thực tập</th><td>{viewTarget.statusText}</td></tr>
        </tbody>
      </table>

      {viewTarget.internshipStatus === "DOING" ? (
        <div style={{ marginTop: 14 }}>
          <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>
            Thông tin tiếp nhận thực tập
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <b>Thời gian tiếp nhận thực tập</b>:{" "}
              {viewTarget.internshipBatch?.startDate ? formatDateVi(viewTarget.internshipBatch.startDate) : "—"} -{" "}
              {viewTarget.internshipBatch?.endDate ? formatDateVi(viewTarget.internshipBatch.endDate) : "—"}
            </div>
            <div><b>Tên doanh nghiệp</b>: {viewTarget.enterprise?.companyName ?? "—"}</div>
            <div><b>MST</b>: {viewTarget.enterprise?.taxCode ?? "—"}</div>
            <div><b>Địa chỉ trụ sở chính</b>: {viewTarget.enterprise?.headquartersAddress ?? "—"}</div>
          </div>
        </div>
      ) : null}

      {viewTarget.internshipStatus === "REPORT_SUBMITTED" && viewTarget.report ? (
        <div style={{ marginTop: 14 }}>
          <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>File BCTT</div>
          <a
            className={adminStyles.detailLink}
            href={dataUrlFromBase64(viewTarget.report.reportMime, viewTarget.report.reportBase64)}
            download={viewTarget.report.reportFileName}
          >
            Tải BCTT: {viewTarget.report.reportFileName}
          </a>
        </div>
      ) : null}
    </MessagePopup>
  );
}
