"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import Pagination from "../../components/Pagination";
import type { JobRow, JobStatus } from "@/lib/types/doanhnghiep-ung-vien";
import {
  DOANHNGHIEP_UNG_VIEN_ERROR_DEFAULT,
  DOANHNGHIEP_UNG_VIEN_PAGE_SIZE,
  DOANHNGHIEP_UNG_VIEN_STATUS_LABEL
} from "@/lib/constants/doanhnghiep-ung-vien";
import { buildDoanhNghiepUngVienListUrl, formatDateVi, getDoanhNghiepUngVienLoadErrorMessage } from "@/lib/utils/doanhnghiep-ung-vien";

export default function DoanhNghiepUngVienPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<JobRow[]>([]);

  const [q, setQ] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = DOANHNGHIEP_UNG_VIEN_PAGE_SIZE;

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  async function load(nextPage = 1) {
    setLoading(true);
    setError("");
    try {
      const url = buildDoanhNghiepUngVienListUrl({
        origin: window.location.origin,
        q,
        createdDate,
        deadlineDate,
        status
      });
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || DOANHNGHIEP_UNG_VIEN_ERROR_DEFAULT);
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(nextPage);
    } catch (e: any) {
      setError(getDoanhNghiepUngVienLoadErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, createdDate, deadlineDate, status]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý ứng viên</h1>
        <p className={styles.subtitle}>Theo dõi số lượng ứng viên ứng tuyển theo từng tin và xem chi tiết hồ sơ.</p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      <div className={adminStyles.searchToolbar}>
        <div className={adminStyles.searchField} style={{ minWidth: 320, flex: 1 }}>
          <label>Tiêu đề</label>
          <input
            className={adminStyles.textInputSearch}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập tiêu đề tin tuyển dụng"
          />
        </div>

        <div className={adminStyles.searchField}>
          <label>Ngày đăng</label>
          <input className={adminStyles.textInputSearch} type="date" value={createdDate} onChange={(e) => setCreatedDate(e.target.value)} />
        </div>

        <div className={adminStyles.searchField}>
          <label>Hạn tuyển dụng</label>
          <input className={adminStyles.textInputSearch} type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
        </div>

        <div className={adminStyles.searchField}>
          <label>Trạng thái</label>
          <select className={adminStyles.selectInput} value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="ACTIVE">Đang tuyển</option>
            <option value="STOPPED">Dừng tuyển</option>
          </select>
        </div>

        <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={() => void load(1)} disabled={loading}>
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
                <th>Tiêu đề</th>
                <th>Ngày đăng</th>
                <th>Hạn tuyển dụng</th>
                <th>Số lượng tuyển</th>
                <th>Số lượng ứng viên</th>
                <th>Trạng thái tin</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.modulePlaceholder}>
                    Không có tin tuyển dụng phù hợp.
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td data-label="Tiêu đề">{row.title}</td>
                    <td data-label="Ngày đăng">{formatDateVi(row.createdAt)}</td>
                    <td data-label="Hạn tuyển dụng">{formatDateVi(row.deadlineAt)}</td>
                    <td data-label="Số lượng tuyển">{row.recruitmentCount}</td>
                    <td data-label="Số lượng ứng viên">{row.applicantCount}</td>
                    <td data-label="Trạng thái tin">{DOANHNGHIEP_UNG_VIEN_STATUS_LABEL[row.status]}</td>
                    <td data-label="Thao tác">
                      <a className={adminStyles.detailLink} href={`/doanhnghiep/ung-vien/${row.id}`}>
                        Xem chi tiết
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={items.length}
          onPageChange={setPage}
          buttonClassName={adminStyles.btn}
          activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
        />
      ) : null}
    </main>
  );
}
