import type { JobStatus } from "@/lib/types/doanhnghiep-ung-vien";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  q: string;
  createdDate: string;
  deadlineDate: string;
  status: JobStatus | "all";
  loading: boolean;
  onQChange: (v: string) => void;
  onCreatedDateChange: (v: string) => void;
  onDeadlineDateChange: (v: string) => void;
  onStatusChange: (v: JobStatus | "all") => void;
  onSearch: () => void;
};

export default function UngVienToolbar({
  q,
  createdDate,
  deadlineDate,
  status,
  loading,
  onQChange,
  onCreatedDateChange,
  onDeadlineDateChange,
  onStatusChange,
  onSearch
}: Props) {
  return (
    <div className={adminStyles.searchToolbar}>
      <div className={`${adminStyles.searchField} ${adminStyles.searchFieldGrow}`}>
        <label>Tiêu đề</label>
        <input
          className={adminStyles.textInputSearch}
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Nhập tiêu đề tin tuyển dụng"
        />
      </div>

      <div className={adminStyles.searchField}>
        <label>Ngày đăng</label>
        <input
          className={adminStyles.textInputSearch}
          type="date"
          value={createdDate}
          onChange={(e) => onCreatedDateChange(e.target.value)}
        />
      </div>

      <div className={adminStyles.searchField}>
        <label>Hạn tuyển dụng</label>
        <input
          className={adminStyles.textInputSearch}
          type="date"
          value={deadlineDate}
          onChange={(e) => onDeadlineDateChange(e.target.value)}
        />
      </div>

      <div className={adminStyles.searchField}>
        <label>Trạng thái</label>
        <select
          className={adminStyles.selectInput}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as JobStatus | "all")}
        >
          <option value="all">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="REJECTED">Từ chối</option>
          <option value="ACTIVE">Đang tuyển</option>
          <option value="STOPPED">Dừng tuyển</option>
        </select>
      </div>

      <button
        type="button"
        className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
        onClick={onSearch}
        disabled={loading}
      >
        Tìm kiếm
      </button>
    </div>
  );
}
