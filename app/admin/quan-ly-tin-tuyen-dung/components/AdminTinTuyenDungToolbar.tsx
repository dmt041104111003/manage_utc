"use client";

import type { InternshipBatchRow } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import styles from "../../styles/dashboard.module.css";

type Props = {
  searchQ: string;
  searchBatchId: string;
  searchStatus: string;
  batches: InternshipBatchRow[];
  onChangeSearchQ: (v: string) => void;
  onChangeSearchBatchId: (v: string) => void;
  onChangeSearchStatus: (v: string) => void;
  onSearch: () => void;
};

export default function AdminTinTuyenDungToolbar(props: Props) {
  const {
    searchQ,
    searchBatchId,
    searchStatus,
    batches,
    onChangeSearchQ,
    onChangeSearchBatchId,
    onChangeSearchStatus,
    onSearch
  } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField}>
        <label>Tên tiêu đề / Tên doanh nghiệp</label>
        <input
          className={styles.textInputSearch}
          value={searchQ}
          onChange={(e) => onChangeSearchQ(e.target.value)}
          placeholder="Nhập tên"
        />
      </div>
      <div className={styles.searchField}>
        <label>Đợt thực tập</label>
        <select className={styles.selectInput} value={searchBatchId} onChange={(e) => onChangeSearchBatchId(e.target.value)}>
          <option value="all">Tất cả</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.semester} {b.schoolYear})
            </option>
          ))}
        </select>
      </div>
      <div className={styles.searchField}>
        <label>Trạng thái</label>
        <select className={styles.selectInput} value={searchStatus} onChange={(e) => onChangeSearchStatus(e.target.value)}>
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
