"use client";

import type { AccountStatus, Role } from "@/lib/types/admin-quan-ly-tai-khoan";
import styles from "../../styles/dashboard.module.css";

type Props = {
  searchQ: string;
  filterRole: Role | "all";
  filterStatus: AccountStatus | "all";
  onChangeSearchQ: (v: string) => void;
  onChangeFilterRole: (v: Role | "all") => void;
  onChangeFilterStatus: (v: AccountStatus | "all") => void;
  onSearch: () => void;
};

export default function AdminTaiKhoanToolbar(props: Props) {
  const { searchQ, filterRole, filterStatus, onChangeSearchQ, onChangeFilterRole, onChangeFilterStatus, onSearch } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField}>
        <label>Tìm kiếm (tên / SĐT / email / MST)</label>
        <input
          className={styles.textInputSearch}
          value={searchQ}
          onChange={(e) => onChangeSearchQ(e.target.value)}
          placeholder="Nhập từ khóa"
        />
      </div>
      <div className={styles.searchField}>
        <label>Phân quyền</label>
        <select className={styles.selectInput} value={filterRole} onChange={(e) => onChangeFilterRole(e.target.value as Role | "all")}>
          <option value="all">Tất cả</option>
          <option value="sinhvien">SV</option>
          <option value="giangvien">GVHD</option>
          <option value="doanhnghiep">DN</option>
        </select>
      </div>
      <div className={styles.searchField}>
        <label>Trạng thái</label>
        <select className={styles.selectInput} value={filterStatus} onChange={(e) => onChangeFilterStatus(e.target.value as AccountStatus | "all")}>
          <option value="all">Tất cả</option>
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
