"use client";

import FormPopup from "../../../../components/FormPopup";
import type { Applicant, JobApplicationStatus } from "@/lib/types/doanhnghiep-ung-vien-detail";
import { getAvailableNextStatuses } from "@/lib/types/doanhnghiep-ung-vien-detail";
import {
  applicationStatusLabel,
  applicationStatusColor,
  responseLabel,
  degreeLabel
} from "@/lib/constants/doanhnghiep-ung-vien-detail";
import { formatDateTimeVi } from "@/lib/utils/doanhnghiep-ung-vien-detail";
import adminStyles from "../../../../admin/styles/dashboard.module.css";

async function openCvPreview(applicationId: string) {
  const w = window.open("about:blank", "_blank", "noopener,noreferrer");
  const res = await fetch(`/api/files/job-application/${applicationId}/cv`);
  if (!res.ok) {
    try { w?.close(); } catch {}
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (w) w.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type Props = {
  viewTarget: Applicant | null;
  busy: boolean;
  nextStatus: JobApplicationStatus;
  interviewAt: string;
  interviewLocation: string;
  responseDeadline: string;
  onNextStatusChange: (s: JobApplicationStatus) => void;
  onInterviewAtChange: (v: string) => void;
  onInterviewLocationChange: (v: string) => void;
  onResponseDeadlineChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const nextStatusLabel: Record<JobApplicationStatus, string> = {
  PENDING_REVIEW: "Chờ xem xét",
  INTERVIEW_INVITED: "Mời phỏng vấn",
  OFFERED: "Trúng tuyển",
  REJECTED: "Từ chối",
  STUDENT_DECLINED: "Ứng viên từ chối"
};

function tomorrowDateTimeLocalMin(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  // datetime-local expects: YYYY-MM-DDTHH:mm
  return `${yyyy}-${mm}-${dd}T00:00`;
}

function maxDateTimeLocal(a: string, b: string): string {
  // Works for YYYY-MM-DDTHH:mm
  return a >= b ? a : b;
}

export default function ApplicantDetailPopup({
  viewTarget,
  busy,
  nextStatus,
  interviewAt,
  interviewLocation,
  responseDeadline,
  onNextStatusChange,
  onInterviewAtChange,
  onInterviewLocationChange,
  onResponseDeadlineChange,
  onClose,
  onSave
}: Props) {
  if (!viewTarget) return null;

  const minDateTime = tomorrowDateTimeLocalMin();
  const minResponseDeadline = interviewAt ? maxDateTimeLocal(minDateTime, interviewAt) : minDateTime;
  const availableStatuses = getAvailableNextStatuses(viewTarget.status, viewTarget.response);
  const canUpdate = availableStatuses.length > 0;
  const canSave = canUpdate && viewTarget.internshipStatus === "NOT_STARTED";

  const statusColors = applicationStatusColor[viewTarget.status];
  const student = viewTarget.student;

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
          {canSave ? (
            <button
              type="button"
              className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
              onClick={onSave}
              disabled={busy}
            >
              Lưu
            </button>
          ) : null}
        </>
      }
    >
      {/* Student Info */}
      <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>
        Thông tin ứng viên
      </div>
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Họ tên</th>
            <td>{student.fullName}</td>
          </tr>
          <tr>
            <th scope="row">Bậc</th>
            <td>{student.degree ? (degreeLabel[student.degree] ?? student.degree) : "—"}</td>
          </tr>
          <tr>
            <th scope="row">SĐT</th>
            <td>{student.phone ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>{student.email}</td>
          </tr>
          <tr>
            <th scope="row">Địa chỉ hiện tại</th>
            <td>{student.currentAddress || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Thư giới thiệu bản thân</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{viewTarget.coverLetter || "—"}</td>
          </tr>
          <tr>
            <th scope="row">File CV đính kèm</th>
            <td>
              {viewTarget.cvPublicId ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className={adminStyles.textLinkBtn} onClick={() => openCvPreview(viewTarget.id)}>
                    Xem CV
                  </button>
                  <a className={adminStyles.detailLink} href={`/api/files/job-application/${viewTarget.id}/cv?download=1`}>
                    Tải CV
                  </a>
                </div>
              ) : (
                "—"
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* History */}
      <div className={adminStyles.detailSectionTitle} style={{ margin: "16px 0 8px" }}>
        Lịch sử phản hồi
      </div>
      {Array.isArray(viewTarget.history) && viewTarget.history.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          {(viewTarget.history as Record<string, unknown>[])
            .slice()
            .reverse()
            .map((h, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTimeVi((h?.at as string) || null)}</div>
                <div style={{ fontSize: 13 }}>
                  {h?.action === "STATUS_UPDATE" ? (
                    <>
                      <span style={{ color: "#374151" }}>
                        {h.by === "ENTERPRISE" ? "Doanh nghiệp" : "Hệ thống"} cập nhật:{" "}
                        <b>{applicationStatusLabel[h.from as JobApplicationStatus] ?? (h.from as string)}</b>
                        {" → "}
                        <b>{applicationStatusLabel[h.to as JobApplicationStatus] ?? (h.to as string)}</b>
                      </span>
                      {h?.interviewAt ? (
                        <div style={{ color: "#6b7280", fontSize: 12 }}>
                          Thời gian phỏng vấn: {formatDateTimeVi(h.interviewAt as string)}
                        </div>
                      ) : null}
                      {h?.interviewLocation ? (
                        <div style={{ color: "#6b7280", fontSize: 12 }}>
                          Địa điểm: {h.interviewLocation as string}
                        </div>
                      ) : null}
                      {h?.responseDeadline ? (
                        <div style={{ color: "#6b7280", fontSize: 12 }}>
                          Thời hạn phản hồi: {formatDateTimeVi(h.responseDeadline as string)}
                        </div>
                      ) : null}
                    </>
                  ) : h?.action === "APPLIED" ? (
                    <span style={{ color: "#374151" }}>
                      Ứng viên nộp hồ sơ:{" "}
                      <b>{applicationStatusLabel[h.status as JobApplicationStatus] ?? (h.status as string) ?? "—"}</b>
                    </span>
                  ) : h?.action === "STUDENT_RESPONSE" ? (
                    <span style={{ color: "#374151" }}>
                      Ứng viên phản hồi:{" "}
                      <b>
                        {(() => {
                          const purpose = String((h as any)?.purpose || "");
                          const accepted = h.response === "ACCEPTED";
                          if (purpose === "respond_interview") return accepted ? "Chấp nhận phỏng vấn" : "Từ chối phỏng vấn";
                          if (purpose === "respond_offer") return accepted ? "Chấp nhận thực tập" : "Từ chối thực tập";
                          return accepted ? "Chấp nhận" : "Từ chối";
                        })()}
                      </b>
                    </span>
                  ) : ["CONFIRM_INTERVIEW", "DECLINE_INTERVIEW", "CONFIRM_INTERNSHIP", "DECLINE_INTERNSHIP"].includes(
                      String(h?.action || "")
                    ) ? (
                    <span style={{ color: "#374151" }}>
                      Ứng viên phản hồi:{" "}
                      <b>
                        {h?.action === "CONFIRM_INTERVIEW"
                          ? "Xác nhận phỏng vấn"
                          : h?.action === "DECLINE_INTERVIEW"
                            ? "Từ chối phỏng vấn"
                            : h?.action === "CONFIRM_INTERNSHIP"
                              ? "Xác nhận thực tập"
                              : "Từ chối thực tập"}
                      </b>
                    </span>
                  ) : h?.action === "AUTO_DECLINED" ? (
                    <span style={{ color: "#dc2626" }}>Hệ thống tự động từ chối (quá hạn phản hồi)</span>
                  ) : (
                    <span style={{ color: "#6b7280" }}>{JSON.stringify(h)}</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#6b7280" }}>Chưa có lịch sử phản hồi.</p>
      )}

      {/* Current status summary */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: "#f9fafb", borderRadius: 8, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>
          Trạng thái:{" "}
          <span
            style={{
              background: statusColors.bg,
              color: statusColors.color,
              borderRadius: 4,
              padding: "2px 8px",
              fontWeight: 600,
              fontSize: 12
            }}
          >
            {applicationStatusLabel[viewTarget.status]}
          </span>
        </span>
        <span>Ứng viên: <b>{responseLabel[viewTarget.response]}</b></span>
        {viewTarget.responseDeadline ? (
          <span>Hạn phản hồi: <b>{formatDateTimeVi(viewTarget.responseDeadline)}</b></span>
        ) : null}
      </div>

      {/* Update status section */}
      <div className={adminStyles.detailSectionTitle} style={{ margin: "16px 0 8px" }}>
        Cập nhật trạng thái
      </div>

      {viewTarget.internshipStatus !== "NOT_STARTED" ? (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            color: "#c2410c",
            fontWeight: 500
          }}
        >
          Sinh viên đã thực tập. Không thể cập nhật trạng thái hồ sơ.
        </div>
      ) : !canUpdate ? (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            color: "#6b7280"
          }}
        >
          {viewTarget.status === "REJECTED" || viewTarget.status === "STUDENT_DECLINED"
            ? "Hồ sơ đã kết thúc. Không thể cập nhật thêm."
            : viewTarget.status === "INTERVIEW_INVITED" && viewTarget.response === "PENDING"
              ? "Đang chờ ứng viên phản hồi lời mời phỏng vấn."
              : viewTarget.status === "OFFERED"
                ? "Đang chờ ứng viên phản hồi lời mời thực tập."
                : "Không thể cập nhật trạng thái."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
              Trạng thái mới
            </label>
            <select
              className={adminStyles.selectInput}
              value={nextStatus}
              onChange={(e) => onNextStatusChange(e.target.value as JobApplicationStatus)}
              disabled={busy}
            >
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {nextStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          {nextStatus === "INTERVIEW_INVITED" ? (
            <>
              <div>
                <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Thời gian phỏng vấn <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  className={adminStyles.textInputSearch}
                  type="datetime-local"
                  value={interviewAt}
                  min={minDateTime}
                  onChange={(e) => onInterviewAtChange(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Địa điểm phỏng vấn <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  className={adminStyles.textInputSearch}
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => onInterviewLocationChange(e.target.value)}
                  placeholder="Nhập địa điểm phỏng vấn"
                  disabled={busy}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Thời hạn phản hồi <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  className={adminStyles.textInputSearch}
                  type="datetime-local"
                  value={responseDeadline}
                  min={minResponseDeadline}
                  onChange={(e) => onResponseDeadlineChange(e.target.value)}
                  disabled={busy}
                />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Sau thời hạn này, nếu ứng viên chưa phản hồi, hệ thống sẽ tự động từ chối.
                </div>
              </div>
            </>
          ) : nextStatus === "OFFERED" ? (
            <div>
              <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Thời hạn phản hồi <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                className={adminStyles.textInputSearch}
                type="datetime-local"
                value={responseDeadline}
                min={minDateTime}
                onChange={(e) => onResponseDeadlineChange(e.target.value)}
                disabled={busy}
              />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Sau thời hạn này, nếu ứng viên chưa phản hồi, hệ thống sẽ tự động từ chối.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </FormPopup>
  );
}
