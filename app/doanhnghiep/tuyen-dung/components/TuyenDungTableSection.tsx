import Pagination from "../../../components/Pagination";
import type { JobListItem, JobStatus } from "@/lib/types/doanhnghiep-tuyen-dung";
import { DOANHNGHIEP_TUYEN_DUNG_PAGE_SIZE, DOANHNGHIEP_TUYEN_DUNG_STATUS_LABEL, DOANHNGHIEP_TUYEN_DUNG_WORK_TYPE_LABEL } from "@/lib/constants/doanhnghiep-tuyen-dung";
import { canEditStatus, canStopStatus, formatDateVi } from "@/lib/utils/doanhnghiep-tuyen-dung";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

const PAGE_SIZE = DOANHNGHIEP_TUYEN_DUNG_PAGE_SIZE;

type Props = {
  loading: boolean;
  items: JobListItem[];
  page: number;
  busyId: string | null;
  onView: (row: JobListItem) => void;
  onEdit: (row: JobListItem) => void;
  onStop: (row: JobListItem) => void;
  onDelete: (row: JobListItem) => void;
  onPageChange: (p: number) => void;
};

export default function TuyenDungTableSection({
  loading,
  items,
  page,
  busyId,
  onView,
  onEdit,
  onStop,
  onDelete,
  onPageChange
}: Props) {
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <p className={styles.modulePlaceholder}>Đang tải…</p>;
  }

  return (
    <>
      <div className={adminStyles.tableWrap}>
        <table className={adminStyles.dataTable}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tiêu đề</th>
              <th>Ngày đăng tin</th>
              <th>Số lượng tuyển dụng</th>
              <th>Chuyên môn</th>
              <th>Hình thức làm việc</th>
              <th>Trạng thái tin</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.modulePlaceholder}>
                  Không có tin tuyển dụng phù hợp.
                </td>
              </tr>
            ) : (
              pagedItems.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td data-label="Tiêu đề">{row.title}</td>
                  <td data-label="Ngày đăng tin">{formatDateVi(row.createdAt)}</td>
                  <td data-label="Số lượng tuyển dụng">{row.recruitmentCount}</td>
                  <td data-label="Chuyên môn">{row.expertise}</td>
                  <td data-label="Hình thức làm việc">{DOANHNGHIEP_TUYEN_DUNG_WORK_TYPE_LABEL[row.workType]}</td>
                  <td data-label="Trạng thái tin">{DOANHNGHIEP_TUYEN_DUNG_STATUS_LABEL[row.status as JobStatus]}</td>
                  <td data-label="Thao tác">
                    <button type="button" className={adminStyles.textLinkBtn} onClick={() => onView(row)}>
                      Xem
                    </button>
                    {canEditStatus(row.status) ? (
                      <button type="button" className={adminStyles.textLinkBtn} disabled={busyId !== null} onClick={() => onEdit(row)}>
                        Sửa
                      </button>
                    ) : null}
                    {canStopStatus(row.status) ? (
                      <button type="button" className={adminStyles.textLinkBtn} disabled={busyId !== null} onClick={() => onStop(row)}>
                        Dừng hoạt động
                      </button>
                    ) : null}
                    <button type="button" className={adminStyles.textLinkBtn} disabled={busyId !== null} onClick={() => onDelete(row)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={items.length}
        onPageChange={onPageChange}
        buttonClassName={adminStyles.btn}
        activeButtonClassName={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
      />
    </>
  );
}
