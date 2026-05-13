import Pagination from "../../../../components/Pagination";
import TableIconButton from "../../../../components/TableIconButton";
import { FiEye } from "react-icons/fi";
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
  totalItems: number;
  page: number;
  busy: boolean;
  query: string;
  status: JobApplicationStatus | "";
  onQueryChange: (v: string) => void;
  onStatusChange: (v: JobApplicationStatus | "") => void;
  onView: (a: Applicant) => void;
  onPageChange: (p: number) => void;
};

export default function ApplicantTableSection({
  applicants,
  totalItems,
  page,
  busy,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onView,
  onPageChange
}: Props) {

  return (
    <section style={{ marginTop: 16 }}>
      <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>
        Danh sách ứng viên ứng tuyển
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "nowrap",
          alignItems: "center",
          marginBottom: 10,
          overflowX: "auto"
        }}
      >
        <input
          className={adminStyles.textInputSearch}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm theo tên / SĐT / email"
          disabled={busy}
          style={{ minWidth: 260, flex: "1 1 auto" }}
        />
        <select
          className={adminStyles.selectInput}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as any)}
          disabled={busy}
          style={{ minWidth: 200 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING_REVIEW">{applicationStatusLabel.PENDING_REVIEW}</option>
          <option value="INTERVIEW_INVITED">{applicationStatusLabel.INTERVIEW_INVITED}</option>
          <option value="OFFERED">{applicationStatusLabel.OFFERED}</option>
          <option value="REJECTED">{applicationStatusLabel.REJECTED}</option>
          <option value="STUDENT_DECLINED">{applicationStatusLabel.STUDENT_DECLINED}</option>
        </select>
        {(query.trim() || status) ? (
          <button
            type="button"
            className={adminStyles.btn}
            onClick={() => {
              onQueryChange("");
              onStatusChange("");
            }}
            disabled={busy}
          >
            Xóa lọc
          </button>
        ) : null}
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
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.modulePlaceholder}>
                  Chưa có ứng viên ứng tuyển.
                </td>
              </tr>
            ) : (
              applicants.map((a, idx) => {
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
                      <TableIconButton label="Xem chi tiết ứng viên" onClick={() => onView(a)} disabled={busy}>
                        <FiEye size={18} />
                      </TableIconButton>
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
        totalItems={totalItems}
        onPageChange={onPageChange}
        buttonClassName={adminStyles.btn}
        activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
      />
    </section>
  );
}
