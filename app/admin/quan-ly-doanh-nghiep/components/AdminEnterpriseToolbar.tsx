"use client";

import { EnterpriseStatus } from "@prisma/client";

import styles from "../../styles/dashboard.module.css";

type Props = {
  searchQ: string;
  searchStatus: string;
  onChangeSearchQ: (v: string) => void;
  onChangeSearchStatus: (v: string) => void;
  onSearch: () => void;
};

export default function AdminEnterpriseToolbar(props: Props) {
  const { searchQ, searchStatus, onChangeSearchQ, onChangeSearchStatus, onSearch } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField}>
        <label htmlFor="admin-dn-q">Tìm theo tên / MST</label>
        <input
          id="admin-dn-q"
          className={styles.textInputSearch}
          value={searchQ}
          onChange={(e) => onChangeSearchQ(e.target.value)}
          placeholder="Tên doanh nghiệp hoặc mã số thuế"
        />
      </div>
      <div className={styles.searchField}>
        <label htmlFor="admin-dn-status">Trạng thái</label>
        <select
          id="admin-dn-status"
          className={styles.selectInput}
          value={searchStatus}
          onChange={(e) => onChangeSearchStatus(e.target.value)}
        >
          <option value="all">Tất cả</option>
          <option value={EnterpriseStatus.PENDING}>Chờ phê duyệt</option>
          <option value={EnterpriseStatus.APPROVED}>Đã phê duyệt</option>
          <option value={EnterpriseStatus.REJECTED}>Từ chối</option>
        </select>
      </div>
      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSearch}>
        Tìm kiếm
      </button>
    </div>
  );
}

