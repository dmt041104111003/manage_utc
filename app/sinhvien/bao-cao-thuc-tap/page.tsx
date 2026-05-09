"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import formStyles from "../../auth/styles/register.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import type {
  InternshipStatus,
  InternshipReportReviewStatus,
  Report,
  SupervisorInfo,
  StatusHistoryEvent
} from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import {
  SINHVIEN_BAO_CAO_THUC_TAP_ENDPOINT,
  SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_SUCCESS_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_SUCCESS_DEFAULT,
  internshipStatusLabel,
  genderLabel,
  supervisorDegreeLabel,
  BCTT_ERROR_INVALID_MIME,
  BCTT_ERROR_REQUIRED_FILE_BEFORE_EDIT,
  BCTT_ERROR_REQUIRED_FILE_BEFORE_SUBMIT
} from "@/lib/constants/sinhvien-bao-cao-thuc-tap";
import { getSinhVienBaoCaoStatusHintText, isAllowedBcttMime } from "@/lib/utils/sinhvien-bao-cao-thuc-tap";

export default function SinhvienBaoCaoThucTapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [internshipStatus, setInternshipStatus] = useState<InternshipStatus>("NOT_STARTED");
  const [supervisor, setSupervisor] = useState<SupervisorInfo | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEvent[]>([]);
  const [canSubmitReport, setCanSubmitReport] = useState(false);
  const [canEditReport, setCanEditReport] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileMime, setSelectedFileMime] = useState<string | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [deleteLocalFile, setDeleteLocalFile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SINHVIEN_BAO_CAO_THUC_TAP_ENDPOINT);
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT);
      const item = data.item;
      setInternshipStatus(item.internshipStatus);
      setSupervisor(item.supervisor ?? null);
      setReport(item.report ?? null);
      setStatusHistory(Array.isArray(item.statusHistory) ? item.statusHistory : []);
      setCanSubmitReport(Boolean(item.ui?.canSubmitReport));
      setCanEditReport(Boolean(item.ui?.canEditReport));
    } catch (e: any) {
      setError(e?.message || SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canShowResults = internshipStatus === "COMPLETED";

  const statusHint = useMemo(() => {
    return getSinhVienBaoCaoStatusHintText({
      canShowResults,
      canSubmitReport,
      canEditReport,
      internshipStatus,
      report
    });
  }, [canShowResults, canSubmitReport, canEditReport, internshipStatus, report?.supervisorRejectReason, report?.reviewStatus, report]);

  function resetUploadState() {
    setSelectedFileName(null);
    setSelectedFileMime(null);
    setSelectedFileBase64(null);
    setDeleteLocalFile(false);
    setFieldErrors({});
  }

  async function onChooseFile(file: File | null) {
    if (!file) return;
    const payload = await readFileAsBase64Payload(file);
    const mime = payload.mime;
    if (!isAllowedBcttMime(mime)) {
      setFieldErrors((prev) => ({ ...prev, file: BCTT_ERROR_INVALID_MIME }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, file: "" }));
    setSelectedFileName(file.name);
    setSelectedFileMime(mime);
    setSelectedFileBase64(payload.base64);
    setDeleteLocalFile(false);
  }

  async function submitNewReport() {
    if (!selectedFileBase64 || !selectedFileMime || !selectedFileName || deleteLocalFile) {
      setFieldErrors({ file: BCTT_ERROR_REQUIRED_FILE_BEFORE_SUBMIT });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sinhvien/bao-cao-thuc-tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportFileName: selectedFileName,
          reportMime: selectedFileMime,
          reportBase64: selectedFileBase64
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT);
      setUploadOpen(false);
      resetUploadState();
      setToast(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_SUCCESS_DEFAULT);
      await load();
    } catch (e: any) {
      setFieldErrors({ file: e?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT });
    } finally {
      setBusy(false);
    }
  }

  async function submitEditReport() {
    if (!selectedFileBase64 || !selectedFileMime || !selectedFileName || deleteLocalFile) {
      setFieldErrors({ file: BCTT_ERROR_REQUIRED_FILE_BEFORE_EDIT });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sinhvien/bao-cao-thuc-tap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportFileName: selectedFileName,
          reportMime: selectedFileMime,
          reportBase64: selectedFileBase64
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT);
      setEditOpen(false);
      resetUploadState();
      setToast(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_SUCCESS_DEFAULT);
      await load();
    } catch (e: any) {
      setFieldErrors({ file: e?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT });
    } finally {
      setBusy(false);
    }
  }

  const reportFileLink = report ? dataUrlFromBase64(report.reportMime, report.reportBase64) : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Theo dõi tiến độ thực tập</h1>
        <p className={styles.subtitle}>Theo dõi GVHD, trạng thái thực tập và lịch sử thay đổi trạng thái (không cập nhật trạng thái).</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <>
          <section className={adminStyles.detailCard} style={{ padding: "20px 22px", maxWidth: "none" }}>
            <div className={adminStyles.detailSectionTitle}>Trạng thái thực tập</div>
            <table className={adminStyles.viewModalDetailTable}>
              <tbody>
                <tr>
                  <th scope="row">Trạng thái hiện tại</th>
                  <td>{internshipStatusLabel[internshipStatus]}</td>
                </tr>
                <tr>
                  <th scope="row">Ghi chú</th>
                  <td>{statusHint}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {internshipStatus === "DOING" || internshipStatus === "SELF_FINANCED" ? (
                <button
                  type="button"
                  className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
                  disabled={!canSubmitReport || busy}
                  onClick={() => {
                    resetUploadState();
                    setUploadOpen(true);
                  }}
                >
                  Nộp BCTT
                </button>
              ) : (
                <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled>
                  Nộp BCTT
                </button>
              )}

              {report ? (
                canEditReport ? (
                  <button
                    type="button"
                    className={adminStyles.btn}
                    disabled={busy}
                    onClick={() => {
                      resetUploadState();
                      setEditOpen(true);
                    }}
                  >
                    Sửa BCTT
                  </button>
                ) : (
                  <button type="button" className={adminStyles.btn} disabled>
                    Sửa BCTT
                  </button>
                )
              ) : null}
            </div>
          </section>

          <section className={adminStyles.detailCard} style={{ padding: "20px 22px", marginTop: 16, maxWidth: "none" }}>
            <div className={adminStyles.detailSectionTitle}>Thông tin GVHD</div>
            {supervisor ? (
              <table className={adminStyles.viewModalDetailTable}>
                <tbody>
                  <tr>
                    <th scope="row">Họ tên</th>
                    <td>{supervisor.fullName}</td>
                  </tr>
                  <tr>
                    <th scope="row">Số điện thoại</th>
                    <td>{supervisor.phone ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Email</th>
                    <td>{supervisor.email}</td>
                  </tr>
                  <tr>
                    <th scope="row">Giới tính</th>
                    <td>{genderLabel[supervisor.gender] ?? supervisor.gender}</td>
                  </tr>
                  <tr>
                    <th scope="row">Bậc</th>
                    <td>{supervisorDegreeLabel[supervisor.degree] ?? supervisor.degree}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className={styles.modulePlaceholder}>Chưa được phân công GVHD.</p>
            )}
          </section>

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
                        <td>{internshipStatusLabel[h.fromStatus]}</td>
                        <td> </td>
                        <td>{internshipStatusLabel[h.toStatus]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.modulePlaceholder}>Chưa có lịch sử.</p>
            )}
          </section>

          {canShowResults ? (
            <section className={adminStyles.detailCard} style={{ padding: "20px 22px", marginTop: 16, maxWidth: "none" }}>
              <div className={adminStyles.detailSectionTitle}>Kết quả thực tập</div>
              <table className={adminStyles.viewModalDetailTable}>
                <tbody>
                  <tr>
                    <th scope="row">Đánh giá GVHD</th>
                    <td style={{ whiteSpace: "pre-wrap" }}>{report?.supervisorEvaluation ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Điểm GVHD</th>
                    <td>{report?.supervisorPoint ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đánh giá DN</th>
                    <td style={{ whiteSpace: "pre-wrap" }}>{report?.enterpriseEvaluation ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Điểm DN</th>
                    <td>{report?.enterprisePoint ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">File BCTT</th>
                    <td>{report && reportFileLink ? <a className={adminStyles.detailLink} href={reportFileLink} download={report.reportFileName}>Tải file</a> : "—"}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      )}

      {uploadOpen ? (
        <FormPopup
          open
          title="Nộp BCTT"
          size="wide"
          busy={busy}
          onClose={() => {
            if (!busy) setUploadOpen(false);
          }}
          actions={
            <>
              <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => setUploadOpen(false)}>
                Hủy
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={() => void submitNewReport()}>
                Nộp BCTT
              </button>
            </>
          }
        >
          <div className={formStyles.field}>
            <label className={formStyles.label}>File BCTT (PDF hoặc DOCX)</label>
            <input
              className={formStyles.input}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                void onChooseFile(f);
              }}
            />
            {fieldErrors.file ? <p className={formStyles.error}>{fieldErrors.file}</p> : null}
          </div>
        </FormPopup>
      ) : null}

      {editOpen ? (
        <FormPopup
          open
          title="Sửa BCTT"
          size="wide"
          busy={busy}
          onClose={() => {
            if (!busy) setEditOpen(false);
          }}
          actions={
            <>
              <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => setEditOpen(false)}>
                Hủy
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={() => void submitEditReport()}>
                Lưu
              </button>
            </>
          }
        >
          <div className={formStyles.field}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Lý do GVHD từ chối:
              <div style={{ marginTop: 4, whiteSpace: "pre-wrap", color: "#111827", fontWeight: 600 }}>{report?.supervisorRejectReason ?? "—"}</div>
            </div>

            <label className={formStyles.label}>File BCTT mới (PDF hoặc DOCX)</label>
            <input
              className={formStyles.input}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                void onChooseFile(f);
              }}
            />

            {report && reportFileLink && !selectedFileBase64 && !deleteLocalFile ? (
              <div style={{ marginTop: 10 }}>
                <a className={adminStyles.detailLink} href={reportFileLink} download={report.reportFileName}>
                  Tải file hiện tại
                </a>
                <button
                  type="button"
                  className={adminStyles.textLinkBtn}
                  disabled={busy}
                  onClick={() => {
                    setDeleteLocalFile(true);
                    setSelectedFileName(null);
                    setSelectedFileMime(null);
                    setSelectedFileBase64(null);
                  }}
                >
                  Xóa file
                </button>
              </div>
            ) : null}

            {fieldErrors.file ? <p className={formStyles.error}>{fieldErrors.file}</p> : null}
          </div>
        </FormPopup>
      ) : null}

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

