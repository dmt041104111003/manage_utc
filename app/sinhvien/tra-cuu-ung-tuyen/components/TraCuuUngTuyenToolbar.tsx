import type { WorkTypeFilter } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";
import { SINHVIEN_TRA_CUU_UNG_TUYEN_SEARCH_BUTTON_TEXT } from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  q: string;
  workType: WorkTypeFilter;
  field: string;
  fieldOptions: string[];
  onQChange: (v: string) => void;
  onWorkTypeChange: (v: WorkTypeFilter) => void;
  onFieldChange: (v: string) => void;
  onSearch: () => void;
};

export default function TraCuuUngTuyenToolbar({
  q,
  workType,
  field,
  fieldOptions,
  onQChange,
  onWorkTypeChange,
  onFieldChange,
  onSearch
}: Props) {
  return (
    <div className={adminStyles.searchToolbar}>
      <div className={adminStyles.searchField}>
        <label>Chuyên môn</label>
        <input
          className={adminStyles.textInputSearch}
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Nhập chuyên môn"
        />
      </div>
      <div className={adminStyles.searchField}>
        <label>Hình thức làm việc</label>
        <select
          className={adminStyles.selectInput}
          value={workType}
          onChange={(e) => onWorkTypeChange(e.target.value as WorkTypeFilter)}
        >
          <option value="all">Tất cả</option>
          <option value="PART_TIME">Part-time</option>
          <option value="FULL_TIME">Full-time</option>
        </select>
      </div>
      <div className={adminStyles.searchField}>
        <label>Lĩnh vực</label>
        <select className={adminStyles.selectInput} value={field} onChange={(e) => onFieldChange(e.target.value)}>
          <option value="all">Tất cả</option>
          {fieldOptions.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <button type="button" className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} onClick={onSearch}>
        {SINHVIEN_TRA_CUU_UNG_TUYEN_SEARCH_BUTTON_TEXT}
      </button>
    </div>
  );
}
