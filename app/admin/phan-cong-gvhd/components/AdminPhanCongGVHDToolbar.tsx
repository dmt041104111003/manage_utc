"use client";

import type { AssignmentStatus } from "@/lib/types/admin-phan-cong-gvhd";
import { ADMIN_PHAN_CONG_GVHD_STATUS_LABEL } from "@/lib/constants/admin-phan-cong-gvhd";

import styles from "../../styles/dashboard.module.css";

type Props = {
  searchQ: string;
  filterFaculty: string;
  filterStatus: AssignmentStatus | "all";
  faculties: string[];
  loading: boolean;
  onChangeSearchQ: (v: string) => void;
  onChangeFilterFaculty: (v: string) => void;
  onChangeFilterStatus: (v: AssignmentStatus | "all") => void;
  onSearch: () => void;
  onOpenAdd: () => void;
};

export default function AdminPhanCongGVHDToolbar(props: Props) {
  const {
    searchQ,
    filterFaculty,
    filterStatus,
    faculties,
    loading,
    onChangeSearchQ,
    onChangeFilterFaculty,
    onChangeFilterStatus,
    onSearch,
    onOpenAdd
  } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField} style={{ minWidth: 320, flex: 1 }}>
        <label>Tìm kiếm</label>
        <input
          className={styles.textInputSearch}
          placeholder="Tên giảng viên hướng dẫn hoặc MSV/Họ tên SV"
          value={searchQ}
          onChange={(e) => onChangeSearchQ(e.target.value)}
        />
      </div>

      <div className={styles.searchField}>
        <label>Khoa</label>
        <select
          className={styles.selectInput}
          value={filterFaculty}
          onChange={(e) => onChangeFilterFaculty(e.target.value)}
        >
          <option value="all">Tất cả khoa</option>
          {faculties.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.searchField}>
        <label>Trạng thái</label>
        <select
          className={styles.selectInput}
          value={filterStatus}
          onChange={(e) => onChangeFilterStatus(e.target.value as AssignmentStatus | "all")}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="GUIDING">{ADMIN_PHAN_CONG_GVHD_STATUS_LABEL.GUIDING}</option>
          <option value="COMPLETED">{ADMIN_PHAN_CONG_GVHD_STATUS_LABEL.COMPLETED}</option>
        </select>
      </div>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={() => onSearch()}
        disabled={loading}
      >
        Tìm kiếm
      </button>

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onOpenAdd}>
        Thêm phân công
      </button>
    </div>
  );
}

