import type { JobStatus } from "@/lib/types/doanhnghiep-tuyen-dung";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  searchQ: string;
  searchDate: string;
  searchStatus: "all" | JobStatus;
  onSearchQChange: (v: string) => void;
  onSearchDateChange: (v: string) => void;
  onSearchStatusChange: (v: "all" | JobStatus) => void;
  onSearch: () => void;
  onAdd: () => void;
};

export default function TuyenDungToolbar({
  searchQ,
  searchDate,
  searchStatus,
  onSearchQChange,
  onSearchDateChange,
  onSearchStatusChange,
  onSearch,
  onAdd
}: Props) {
  return (
    <div className={adminStyles.searchToolbar}>
      <div className={adminStyles.searchField} style={{ minWidth: 280, flex: 1 }}>
        <label>Tên tiêu đề / Vị trí tuyển dụng</label>
        <input
          className={adminStyles.textInputSearch}
          value={searchQ}
          onChange={(e) => onSearchQChange(e.target.value)}
          placeholder="Nhập tiêu đề hoặc vị trí tuyển dụng"
          style={{ width: "100%" }}
        />
      </div>
      <div className={adminStyles.searchField} style={{ minWidth: 180, flex: 1 }}>
        <label>Ngày đăng tin</label>
        <input
          className={adminStyles.textInputSearch}
          type="date"
          value={searchDate}
          onChange={(e) => onSearchDateChange(e.target.value)}
          placeholder="Chọn ngày"
          style={{ width: "100%" }}
        />
      </div>
      <div className={adminStyles.searchField} style={{ minWidth: 180, flex: 1 }}>
        <label>Trạng thái</label>
        <select
          className={adminStyles.selectInput}
          value={searchStatus}
          onChange={(e) => onSearchStatusChange(e.target.value as "all" | JobStatus)}
          style={{ width: "100%" }}
        >
          <option value="all">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="REJECTED">Từ chối duyệt</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="STOPPED">Dừng hoạt động</option>
        </select>
      </div>
      <button
        type="button"
        className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
        onClick={onSearch}
        style={{ minWidth: 120 }}
      >
        Tìm kiếm
      </button>
      <button
        type="button"
        className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
        onClick={onAdd}
        style={{ minWidth: 170 }}
      >
        Thêm tin tuyển dụng
      </button>
    </div>
  );
}
