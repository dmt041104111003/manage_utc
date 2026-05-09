import FormPopup from "../../../../components/FormPopup";
import type { Applicant, JobApplicationStatus } from "@/lib/types/doanhnghiep-ung-vien-detail";
import { applicationStatusLabel, responseLabel } from "@/lib/constants/doanhnghiep-ung-vien-detail";
import { formatDateTimeVi } from "@/lib/utils/doanhnghiep-ung-vien-detail";
import adminStyles from "../../../../admin/styles/dashboard.module.css";

type Props = {
  viewTarget: Applicant | null;
  busy: boolean;
  nextStatus: JobApplicationStatus;
  interviewAt: string;
  onNextStatusChange: (s: JobApplicationStatus) => void;
  onInterviewAtChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function ApplicantDetailPopup({
  viewTarget,
  busy,
  nextStatus,
  interviewAt,
  onNextStatusChange,
  onInterviewAtChange,
  onClose,
  onSave
}: Props) {
  if (!viewTarget) return null;

  return (
    <FormPopup
      open
      title="Xem chi tiết ứng viên"
      size="extraWide"
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <button type="button" className={adminStyles.btn} onClick={onClose} disabled={busy}>
            Đóng
          </button>
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
            onClick={onSave}
            disabled={busy}
          >
            Lưu
          </button>
        </>
      }
    >
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Họ tên</th>
            <td>{viewTarget.student.fullName}</td>
          </tr>
          <tr>
            <th scope="row">SĐT</th>
            <td>{viewTarget.student.phone ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>{viewTarget.student.email}</td>
          </tr>
          <tr>
            <th scope="row">Thư giới thiệu bản thân</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{viewTarget.coverLetter || "—"}</td>
          </tr>
          <tr>
            <th scope="row">File CV đính kèm</th>
            <td>
              {viewTarget.cvUrl ? (
                <a className={adminStyles.detailLink} href={viewTarget.cvUrl}>
                  Tải CV
                </a>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Lịch sử phản hồi</th>
            <td>
              {Array.isArray(viewTarget.history) && viewTarget.history.length ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {viewTarget.history
                    .slice()
                    .reverse()
                    .map((h: Record<string, unknown>, idx: number) => (
                      <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTimeVi((h?.at as string) || null)}</div>
                        <div style={{ fontSize: 13 }}>
                          {h?.action === "STATUS_UPDATE" ? (
                            <>
                              Cập nhật trạng thái: <b>{h?.from as string}</b> → <b>{h?.to as string}</b>
                              {h?.interviewAt ? (
                                <span>
                                  {" "}• Phỏng vấn: <b>{formatDateTimeVi(h.interviewAt as string)}</b>
                                </span>
                              ) : null}
                            </>
                          ) : (
                            JSON.stringify(h)
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Cập nhật trạng thái</th>
            <td>
              <div style={{ display: "grid", gap: 10 }}>
                <select
                  className={adminStyles.selectInput}
                  value={nextStatus}
                  onChange={(e) => onNextStatusChange(e.target.value as JobApplicationStatus)}
                  disabled={busy}
                >
                  <option value="PENDING_REVIEW">Chờ xem xét</option>
                  <option value="INTERVIEW_INVITED">Mời phỏng vấn</option>
                  <option value="OFFERED">Trúng tuyển</option>
                  <option value="REJECTED">Từ chối</option>
                </select>

                {nextStatus === "INTERVIEW_INVITED" ? (
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Thời gian mời phỏng vấn</div>
                    <input
                      className={adminStyles.textInputSearch}
                      type="datetime-local"
                      value={interviewAt}
                      onChange={(e) => onInterviewAtChange(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                ) : null}

                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Trạng thái hiện tại: <b>{applicationStatusLabel[viewTarget.status]}</b> • Ứng viên:{" "}
                  <b>{responseLabel[viewTarget.response]}</b>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </FormPopup>
  );
}
