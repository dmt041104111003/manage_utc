"use client";

import styles from "../../styles/dashboard.module.css";

type Props = {
  q: string;
  filterFaculty: string;
  filterStatus: string;
  filterDegree: string;
  faculties: string[];
  onChangeQ: (v: string) => void;
  onChangeFilterFaculty: (v: string) => void;
  onChangeFilterStatus: (v: string) => void;
  onChangeFilterDegree: (v: string) => void;
  onSearch: () => void;
  onExportFiltered: () => void;
  busy: boolean;
};

export default function AdminTienDoToolbar(props: Props) {
  const {
    q,
    filterFaculty,
    filterStatus,
    filterDegree,
    faculties,
    onChangeQ,
    onChangeFilterFaculty,
    onChangeFilterStatus,
    onChangeFilterDegree,
    onSearch,
    onExportFiltered,
    busy
  } = props;

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.searchField}>
        <label>Tìm theo MSV / Họ tên / SĐT / Email</label>
        <input
          className={styles.textInputSearch}
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
          placeholder="Nhập từ khóa"
        />
      </div>
      <div className={styles.searchField}>
        <label>Khoa</label>
        <select className={styles.selectInput} value={filterFaculty} onChange={(e) => onChangeFilterFaculty(e.target.value)}>
          <option value="all">Tất cả</option>
          {faculties.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.searchField}>
        <label>Trạng thái thực tập</label>
        <select className={styles.selectInput} value={filterStatus} onChange={(e) => onChangeFilterStatus(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="NOT_STARTED">Chưa thực tập</option>
          <option value="DOING">Đang thực tập</option>
          <option value="SELF_FINANCED">Thực tập tự túc</option>
          <option value="REPORT_SUBMITTED">Đã nộp BCTT</option>
          <option value="APPROVED_REPORT">Đã duyệt BCTT</option>
          <option value="COMPLETED">Hoàn thành thực tập</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>
      <div className={styles.searchField}>
        <label>Bậc</label>
        <select className={styles.selectInput} value={filterDegree} onChange={(e) => onChangeFilterDegree(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="BACHELOR">Cử nhân</option>
          <option value="ENGINEER">Kỹ sư</option>
        </select>
      </div>
      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSearch}>
        Tìm kiếm
      </button>
      <button type="button" className={styles.btn} onClick={onExportFiltered} disabled={busy}>
        Xuất Excel theo bộ lọc
      </button>
    </div>
  );
}
