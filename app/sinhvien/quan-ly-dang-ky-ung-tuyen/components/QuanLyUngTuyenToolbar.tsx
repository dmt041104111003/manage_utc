import type { StatusFilter } from "@/lib/types/sinhvien-quan-ly-dang-ky-ung-tuyen";
import { SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_FIND_BUTTON_TEXT } from "@/lib/constants/sinhvien-quan-ly-dang-ky-ung-tuyen";
import { parseStatusFilterValue } from "@/lib/utils/sinhvien-quan-ly-dang-ky-ung-tuyen";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  onSearch: () => void;
};

export default function QuanLyUngTuyenToolbar({ statusFilter, onStatusFilterChange, onSearch }: Props) {
  return (
    <div className={adminStyles.searchToolbar}>
      <div className={adminStyles.searchField}>
        <label>Trạng thái</label>
        <select
          className={adminStyles.selectInput}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(parseStatusFilterValue(e.target.value))}
        >
          <option value="all">Tất cả</option>
          <option value="PENDING_REVIEW">Chờ xem xét</option>
          <option value="INTERVIEW_INVITED">Mời phỏng vấn</option>
          <option value="OFFERED">Trúng tuyển</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>
      <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={onSearch}>
        {SINHVIEN_QUAN_LY_DANG_KY_UNG_TUYEN_FIND_BUTTON_TEXT}
      </button>
    </div>
  );
}
