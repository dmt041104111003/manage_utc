"use client";

import type { InternshipBatchRow } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import styles from "../../styles/dashboard.module.css";

type Props = {
  searchQ: string;
  searchBatchId: string;
  searchExpertise: string;
  searchStatus: string;
  batches: InternshipBatchRow[];
  expertises: string[];
  loadingBatches: boolean;
  onChangeSearchQ: (v: string) => void;
  onChangeSearchBatchId: (v: string) => void;
  onChangeSearchExpertise: (v: string) => void;
  onChangeSearchStatus: (v: string) => void;
  onSearch: () => void;
};

export default function AdminTinTuyenDungToolbar(props: Props) {
  const {
    searchQ,
    searchBatchId,
    searchExpertise,
    searchStatus,
    batches,
    expertises,
    loadingBatches,
    onChangeSearchQ,
    onChangeSearchBatchId,
    onChangeSearchExpertise,
    onChangeSearchStatus,
    onSearch
  } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField} style={{ flex: 1, minWidth: 220 }}>
        <label>Tiêu đề / Tên doanh nghiệp</label>
        <input
          className={styles.textInputSearch}
          value={searchQ}
          onChange={(e) => onChangeSearchQ(e.target.value)}
          placeholder="Nhập tiêu đề hoặc tên DN"
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>

      <div className={styles.searchField}>
        <label>Đợt thực tập</label>
        <select
          className={styles.selectInput}
          value={searchBatchId}
          onChange={(e) => onChangeSearchBatchId(e.target.value)}
          disabled={loadingBatches}
        >
          <option value="all">Tất cả</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.semester} {b.schoolYear})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.searchField}>
        <label>Ngành/Khoa</label>
        <select
          className={styles.selectInput}
          value={searchExpertise}
          onChange={(e) => onChangeSearchExpertise(e.target.value)}
        >
          <option value="all">Tất cả</option>
          {expertises.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.searchField}>
        <label>Trạng thái</label>
        <select
          className={styles.selectInput}
          value={searchStatus}
          onChange={(e) => onChangeSearchStatus(e.target.value)}
        >
          <option value="all">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="REJECTED">Từ chối duyệt</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="STOPPED">Dừng hoạt động</option>
        </select>
      </div>

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSearch}>
        Tìm kiếm
      </button>
    </div>
  );
}
