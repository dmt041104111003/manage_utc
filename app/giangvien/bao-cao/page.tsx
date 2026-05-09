"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import FormPopup from "../../components/FormPopup";
import { dataUrlFromBase64 } from "@/lib/utils/enterprise-admin-display";
import formStyles from "../../auth/styles/register.module.css";
import type { Degree, InternshipStatus, ReportReviewStatus, Row } from "@/lib/types/giangvien-bao-cao-thuc-tap";
import { degreeLabel } from "@/lib/constants/giangvien-bao-cao-thuc-tap";
import { formatDateVi, validateGiangVienBaoCaoApprove } from "@/lib/utils/giangvien-bao-cao-thuc-tap";

export default function GiangvienQuanLyBCPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<"all" | Degree>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InternshipStatus>("all");

  const [rows, setRows] = useState<Row[]>([]);

  const [toast, setToast] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Row | null>(null);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<Row | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [dqtPoint, setDqtPoint] = useState("");
  const [kthpPoint, setKthpPoint] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (degreeFilter !== "all") sp.set("degree", degreeFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách BCTT.");
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách BCTT.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyText = useMemo(() => (loading ? "" : rows.length ? "" : "Chưa có dữ liệu."), [rows.length, loading]);

  async function submitUpdateInternship() {
    if (!updateTarget) return;
    if (updateTarget.internshipStatus !== "NOT_STARTED") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/update-internship-status/${updateTarget.studentProfileId}`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Cập nhật thất bại.");
      setUpdateOpen(false);
      setUpdateTarget(null);
      setToast(data?.message || "Cập nhật thành công.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Cập nhật thất bại.");
    } finally {
      setBusy(false);
    }
  }

  function validateApprove() {
    return validateGiangVienBaoCaoApprove({ reviewTarget, evaluation, dqtPoint, kthpPoint });
  }

  async function submitApprove() {
    if (!reviewTarget?.report) return;
    const err = validateApprove();
    if (err) {
      setToast(err);
      return;
    }
    setBusy(true);
    try {
      const hasEnterprise = Boolean(reviewTarget.enterprise);
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/${reviewTarget.report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          supervisorEvaluation: evaluation.trim() || null,
          supervisorPoint: Number(dqtPoint.trim()),
          enterpriseEvaluation: null,
          enterprisePoint: hasEnterprise ? Number(kthpPoint.trim()) : null
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Duyệt thất bại.");
      setReviewOpen(false);
      setReviewTarget(null);
      setToast(data?.message || "Duyệt thành công.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Duyệt thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReject() {
    if (!reviewTarget?.report) return;
    const rr = rejectReason.trim();
    if (!rr) {
      setToast("Lý do từ chối là bắt buộc.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/giangvien/bao-cao-thuc-tap/${reviewTarget.report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectReason: rr })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Từ chối thất bại.");
      setReviewOpen(false);
      setReviewTarget(null);
      setRejectReason("");
      setEvaluation("");
      setDqtPoint("");
      setKthpPoint("");
      setToast(data?.message || "Từ chối thành công.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Từ chối thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý BCTT</h1>
        <p className={styles.subtitle}>Duyệt/từ chối BCTT và cập nhật trạng thái thực tập cho sinh viên được phân công.</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField} style={{ maxWidth: 320 }}>
          <label>Tìm theo MSV / Họ tên</label>
          <input className={adminStyles.textInputSearch} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập MSV hoặc họ tên" />
        </div>
        <div className={adminStyles.searchField}>
          <label>Bậc</label>
          <select className={adminStyles.selectInput} value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="BACHELOR">Cử nhân</option>
            <option value="ENGINEER">Kỹ sư</option>
          </select>
        </div>
        <div className={adminStyles.searchField}>
          <label>Trạng thái thực tập</label>
          <select className={adminStyles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="NOT_STARTED">Chưa thực tập</option>
            <option value="DOING">Đang thực tập</option>
            <option value="SELF_FINANCED">Thực tập tự túc</option>
            <option value="REPORT_SUBMITTED">Đã nộp BCTT</option>
            <option value="COMPLETED">Hoàn thành thực tập</option>
            <option value="REJECTED">Từ chối duyệt BCTT</option>
          </select>
        </div>
        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void load()}>
          Tìm kiếm
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
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
                  <td colSpan={7} className={styles.modulePlaceholder}>{emptyText}</td>
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
                        onClick={() => {
                          setViewTarget(r);
                          setViewOpen(true);
                        }}
                        disabled={busy}
                      >
                        Xem chi tiết
                      </button>
                      {r.ui.canUpdateInternshipStatus ? (
                        <button
                          type="button"
                          className={adminStyles.textLinkBtn}
                          disabled={busy}
                          onClick={() => { setUpdateTarget(r); setUpdateOpen(true); }}
                        >
                          Cập nhật trạng thái thực tập
                        </button>
                      ) : null}
                      {r.ui.canReviewReport && r.report ? (
                        <button
                          type="button"
                          className={adminStyles.textLinkBtn}
                          disabled={busy}
                          onClick={() => {
                            setReviewTarget(r);
                            setReviewOpen(true);
                            setRejectReason("");
                            setEvaluation(r.report?.supervisorEvaluation ?? "");
                            setDqtPoint(r.report?.supervisorPoint != null ? String(r.report?.supervisorPoint) : "");
                            setKthpPoint(r.report?.enterprisePoint != null ? String(r.report?.enterprisePoint) : "");
                          }}
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
      )}

      {viewOpen && viewTarget ? (
        <MessagePopup
          open
          title="Xem chi tiết"
          size="extraWide"
          onClose={() => {
            setViewOpen(false);
            setViewTarget(null);
          }}
        >
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
              <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>Thông tin tiếp nhận thực tập</div>
              <div style={{ display: "grid", gap: 8 }}>
                <div><b>Thời gian tiếp nhận thực tập</b>: {viewTarget.internshipBatch?.startDate ? formatDateVi(viewTarget.internshipBatch.startDate) : "—"} - {viewTarget.internshipBatch?.endDate ? formatDateVi(viewTarget.internshipBatch.endDate) : "—"}</div>
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
      ) : null}

      {updateOpen && updateTarget ? (
        <FormPopup
          open
          title="Cập nhật trạng thái thực tập cho SV"
          size="wide"
          busy={busy}
          onClose={() => {
            if (!busy) {
              setUpdateOpen(false);
              setUpdateTarget(null);
            }
          }}
          actions={
            <>
              <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => { setUpdateOpen(false); setUpdateTarget(null); }}>
                Hủy
              </button>
              <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={() => void submitUpdateInternship()}>
                Xác nhận
              </button>
            </>
          }
        >
          <table className={adminStyles.viewModalDetailTable}>
            <tbody>
              <tr><th scope="row">MSV</th><td>{updateTarget.msv}</td></tr>
              <tr><th scope="row">Họ tên</th><td>{updateTarget.fullName}</td></tr>
              <tr><th scope="row">Lớp</th><td>{updateTarget.className}</td></tr>
              <tr><th scope="row">Khoa</th><td>{updateTarget.faculty}</td></tr>
              <tr><th scope="row">Khóa</th><td>{updateTarget.cohort}</td></tr>
              <tr><th scope="row">Bậc</th><td>{degreeLabel[updateTarget.degree]}</td></tr>
              <tr><th scope="row">Trạng thái hiện tại</th><td>Chưa thực tập</td></tr>
              <tr><th scope="row">Cập nhật thành</th><td>Thực tập tự túc</td></tr>
            </tbody>
          </table>
        </FormPopup>
      ) : null}

      {reviewOpen && reviewTarget && reviewTarget.report ? (
        <FormPopup
          open
          title="Duyệt BCTT"
          size="extraWide"
          busy={busy}
          onClose={() => {
            if (!busy) {
              setReviewOpen(false);
              setReviewTarget(null);
            }
          }}
          actions={
            <>
              <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => { setReviewOpen(false); setReviewTarget(null); }}>
                Hủy
              </button>
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <table className={adminStyles.viewModalDetailTable}>
                <tbody>
                  <tr><th scope="row">MSV</th><td>{reviewTarget.msv}</td></tr>
                  <tr><th scope="row">Họ tên</th><td>{reviewTarget.fullName}</td></tr>
                  <tr><th scope="row">Lớp</th><td>{reviewTarget.className}</td></tr>
                  <tr><th scope="row">Khoa</th><td>{reviewTarget.faculty}</td></tr>
                  <tr><th scope="row">Khóa</th><td>{reviewTarget.cohort}</td></tr>
                  <tr><th scope="row">Bậc</th><td>{degreeLabel[reviewTarget.degree]}</td></tr>
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <div className={adminStyles.detailSectionTitle} style={{ marginBottom: 8 }}>File BCTT</div>
                <a className={adminStyles.detailLink} href={dataUrlFromBase64(reviewTarget.report.reportMime, reviewTarget.report.reportBase64)} download={reviewTarget.report.reportFileName}>
                  Tải BCTT: {reviewTarget.report.reportFileName}
                </a>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className={formStyles.label}>Đánh giá</label>
                <textarea
                  className={formStyles.textarea}
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  disabled={busy}
                  placeholder="Không bắt buộc"
                  style={{ width: "100%", minHeight: 100, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className={formStyles.label}>ĐQT</label>
                  <input className={formStyles.input} value={dqtPoint} onChange={(e) => setDqtPoint(e.target.value)} disabled={busy} placeholder="1-10" />
                </div>
                <div>
                  <label className={formStyles.label}>KTHP</label>
                  <input
                    className={formStyles.input}
                    value={kthpPoint}
                    onChange={(e) => setKthpPoint(e.target.value)}
                    disabled={busy || !reviewTarget.enterprise}
                    placeholder={reviewTarget.enterprise ? "1-10" : "—"}
                  />
                </div>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Lý do từ chối (bắt buộc nếu Từ chối)</div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={busy}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} disabled={busy} onClick={() => void submitApprove()}>
                  Duyệt
                </button>
                <button type="button" className={adminStyles.btn} disabled={busy} onClick={() => void submitReject()}>
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </FormPopup>
      ) : null}

      {toast ? (
        <MessagePopup
          open
          title="Thông báo"
          message={toast}
          onClose={() => setToast("")}
          actions={
            <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => setToast("")}>
              Đóng
            </button>
          }
        />
      ) : null}
    </main>
  );
}

