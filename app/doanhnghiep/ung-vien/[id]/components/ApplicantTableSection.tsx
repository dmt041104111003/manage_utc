import Pagination from "../../../../components/Pagination";
import type { Applicant, JobApplicationStatus } from "@/lib/types/doanhnghiep-ung-vien-detail";
import {
  applicationStatusLabel,
  applicationStatusColor,
  responseLabel,
  DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE
} from "@/lib/constants/doanhnghiep-ung-vien-detail";
import adminStyles from "../../../../admin/styles/dashboard.module.css";
import styles from "../../../styles/dashboard.module.css";

const PAGE_SIZE = DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE;

type Props = {
  applicants: Applicant[];
  page: number;
  busy: boolean;
  onView: (a: Applicant) => void;
  onPageChange: (p: number) => void;
};

export default function ApplicantTableSection({ applicants, page, busy, onView, onPageChange }: Props) {
  const paged = applicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section style={{ marginTop: 16 }}>
      <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>
        Danh sách ứng viên ứng tuyển
      </div>

      <div className={adminStyles.tableWrap}>
        <table className={adminStyles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Email</th>
              <th>Trạng thái phản hồi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.modulePlaceholder}>
                  Chưa có ứng viên ứng tuyển.
                </td>
              </tr>
            ) : (
              paged.map((a, idx) => {
                const colors = applicationStatusColor[a.status];
                return (
                  <tr key={a.id}>
                    <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td data-label="Họ tên">{a.student.fullName}</td>
                    <td data-label="SĐT">{a.student.phone ?? "—"}</td>
                    <td data-label="Email">{a.student.email}</td>
                    <td data-label="Trạng thái phản hồi">
                      <span
                        style={{
                          display: "inline-block",
                          background: colors.bg,
                          color: colors.color,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontWeight: 600,
                          fontSize: 12
                        }}
                      >
                        {applicationStatusLabel[a.status as JobApplicationStatus]}
                      </span>
                      {a.response !== "PENDING" ? (
                        <span style={{ marginLeft: 6, fontSize: 12, color: "#6b7280" }}>
                          ({responseLabel[a.response]})
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Thao tác">
                      <button type="button" className={adminStyles.textLinkBtn} onClick={() => onView(a)} disabled={busy}>
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={applicants.length}
        onPageChange={onPageChange}
        buttonClassName={adminStyles.btn}
        activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
      />
    </section>
  );
}
