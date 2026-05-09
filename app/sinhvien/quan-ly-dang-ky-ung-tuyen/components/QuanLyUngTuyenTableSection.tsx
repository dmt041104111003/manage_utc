import type { RespondAction, SinhVienQuanLyDangKyUngTuyenRow } from "@/lib/types/sinhvien-quan-ly-dang-ky-ung-tuyen";
import {
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_EMPTY_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERNSHIP_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERVIEW_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERNSHIP_TEXT,
  SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERVIEW_TEXT,
  sinhvienQuanLyDangKyUngTuyenStatusLabel
} from "@/lib/constants/sinhvien-quan-ly-dang-ky-ung-tuyen";
import { formatDateVi, getSinhVienQuanLyDangKyUngTuyenResponseText } from "@/lib/utils/sinhvien-quan-ly-dang-ky-ung-tuyen";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

type Props = {
  rows: SinhVienQuanLyDangKyUngTuyenRow[];
  busyId: string | null;
  onRespond: (applicationId: string, action: RespondAction) => void;
};

export default function QuanLyUngTuyenTableSection({ rows, busyId, onRespond }: Props) {
  return (
    <div className={adminStyles.tableWrap}>
      <table className={adminStyles.dataTable}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tiêu đề</th>
            <th>Doanh nghiệp</th>
            <th>Chuyên môn</th>
            <th>Ngày ứng tuyển</th>
            <th>Trạng thái</th>
            <th>Phản hồi của SV</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={styles.modulePlaceholder}>
                {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_EMPTY_TEXT}
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.id}>
                <td>{idx + 1}</td>
                <td>
                  <a className={adminStyles.detailLink} href={`/sinhvien/tra-cuu-ung-tuyen/${r.job.id}`}>
                    {r.job.title}
                  </a>
                </td>
                <td>{r.job.companyName}</td>
                <td>{r.job.expertise}</td>
                <td>{formatDateVi(r.appliedAt)}</td>
                <td>{sinhvienQuanLyDangKyUngTuyenStatusLabel[r.status]}</td>
                <td>{getSinhVienQuanLyDangKyUngTuyenResponseText(r)}</td>
                <td>
                  {r.status === "INTERVIEW_INVITED" && r.response === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        className={adminStyles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => onRespond(r.id, "CONFIRM_INTERVIEW")}
                      >
                        {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERVIEW_TEXT}
                      </button>
                      <button
                        type="button"
                        className={adminStyles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => onRespond(r.id, "DECLINE_INTERVIEW")}
                      >
                        {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERVIEW_TEXT}
                      </button>
                    </>
                  ) : null}
                  {r.status === "OFFERED" && r.response === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        className={adminStyles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => onRespond(r.id, "CONFIRM_INTERNSHIP")}
                      >
                        {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_CONFIRM_INTERNSHIP_TEXT}
                      </button>
                      <button
                        type="button"
                        className={adminStyles.textLinkBtn}
                        disabled={busyId !== null}
                        onClick={() => onRespond(r.id, "DECLINE_INTERNSHIP")}
                      >
                        {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_DECLINE_INTERNSHIP_TEXT}
                      </button>
                    </>
                  ) : null}
                  {r.status === "PENDING_REVIEW" || r.status === "REJECTED" || r.status === "STUDENT_DECLINED" || r.response !== "PENDING" ? "—" : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
