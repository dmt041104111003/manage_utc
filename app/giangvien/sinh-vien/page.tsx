"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

import type { BatchOption, Degree, GuidanceStatus, InternshipStatus, Row } from "@/lib/types/giangvien-sinh-vien";
import {
  GIANGVIEN_SINH_VIEN_ENDPOINT,
  GIANGVIEN_SINH_VIEN_EMPTY_TEXT,
  degreeLabel,
  guidanceStatusLabel,
  internshipStatusLabel
} from "@/lib/constants/giangvien-sinh-vien";
import { buildGiangVienSinhVienQueryParams, formatDateVi, getGiangVienSinhVienLoadErrorMessage } from "@/lib/utils/giangvien-sinh-vien";

export default function GiangvienSinhVienPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [batchId, setBatchId] = useState("");
  const [guidanceStatus, setGuidanceStatus] = useState<"all" | GuidanceStatus>("all");

  const [items, setItems] = useState<Row[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const sp = buildGiangVienSinhVienQueryParams({
        q,
        batchId,
        guidanceStatus
      });
      const res = await fetch(`${GIANGVIEN_SINH_VIEN_ENDPOINT}?${sp.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không thể tải danh sách sinh viên được phân công.");
      setItems(Array.isArray(data.items) ? data.items : []);
      setBatches(Array.isArray(data.batches) ? data.batches : []);
    } catch (e: any) {
      setError(getGiangVienSinhVienLoadErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredEmptyText = useMemo(() => {
    if (loading) return "";
    return items.length ? "" : GIANGVIEN_SINH_VIEN_EMPTY_TEXT;
  }, [items.length, loading]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý sinh viên được phân công</h1>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField} style={{ maxWidth: 320 }}>
          <label>Tìm theo MSV / Họ tên</label>
          <input className={adminStyles.textInputSearch} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập MSV hoặc họ tên" />
        </div>
        <div className={adminStyles.searchField}>
          <label>Đợt thực tập</label>
          <select className={adminStyles.selectInput} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Tất cả</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className={adminStyles.searchField}>
          <label>Trạng thái hướng dẫn</label>
          <select className={adminStyles.selectInput} value={guidanceStatus} onChange={(e) => setGuidanceStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="GUIDING">{guidanceStatusLabel.GUIDING}</option>
            <option value="COMPLETED">{guidanceStatusLabel.COMPLETED}</option>
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
                <th>Trạng thái hướng dẫn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.modulePlaceholder}>{filteredEmptyText}</td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    <td data-label="STT">{r.stt}</td>
                    <td data-label="MSV">{r.msv}</td>
                    <td data-label="Họ tên">{r.fullName}</td>
                    <td data-label="Khóa">{r.cohort}</td>
                    <td data-label="Bậc">{degreeLabel[r.degree]}</td>
                    <td data-label="Trạng thái hướng dẫn">{r.guidanceStatusLabel}</td>
                    <td data-label="Thao tác">
                      <button type="button" className={adminStyles.textLinkBtn} onClick={() => { setViewTarget(r); setViewOpen(true); }}>
                        Xem chi tiết
                      </button>
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
          title="Xem chi tiết SV"
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
              <tr><th scope="row">Giới tính</th><td>{viewTarget.gender}</td></tr>
              <tr><th scope="row">Địa chỉ thường trú</th><td>{viewTarget.permanentAddress}</td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
            <div>
              <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái thực tập</div>
              {viewTarget.internshipStatusHistory.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {viewTarget.internshipStatusHistory.map((h, i) => (
                    <div key={`${h.at ?? i}-${i}`} style={{ fontSize: 13, color: "#111827" }}>
                      <span style={{ fontWeight: 600 }}>{internshipStatusLabel[h.toStatus] ?? h.toStatus}</span>
                      <span style={{ color: "#6b7280" }}> - {h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.modulePlaceholder}>—</p>
              )}
            </div>

            <div>
              <div className={adminStyles.detailSectionTitle}>Lịch sử trạng thái hướng dẫn</div>
              {viewTarget.guidanceStatusHistory.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {viewTarget.guidanceStatusHistory.map((h, i) => (
                    <div key={`${h.at ?? i}-${i}`} style={{ fontSize: 13, color: "#111827" }}>
                      <span style={{ fontWeight: 600 }}>{guidanceStatusLabel[h.toStatus] ?? h.toStatus}</span>
                      <span style={{ color: "#6b7280" }}> - {h.at ? new Date(h.at).toLocaleString("vi-VN") : "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.modulePlaceholder}>—</p>
              )}
            </div>
          </div>
        </MessagePopup>
      ) : null}
    </main>
  );
}

