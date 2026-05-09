import Pagination from "../../../components/Pagination";
import type { JobRow } from "@/lib/types/doanhnghiep-ung-vien";
import {
  DOANHNGHIEP_UNG_VIEN_PAGE_SIZE,
  DOANHNGHIEP_UNG_VIEN_STATUS_LABEL
} from "@/lib/constants/doanhnghiep-ung-vien";
import { formatDateVi } from "@/lib/utils/doanhnghiep-ung-vien";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import styles from "../../styles/dashboard.module.css";

const PAGE_SIZE = DOANHNGHIEP_UNG_VIEN_PAGE_SIZE;

type Props = {
  loading: boolean;
  items: JobRow[];
  page: number;
  onPageChange: (p: number) => void;
};

export default function UngVienTableSection({ loading, items, page, onPageChange }: Props) {
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <th>Ngày đăng</th>
              <th>Hạn tuyển dụng</th>
              <th>Số lượng tuyển</th>
              <th>Số lượng ứng viên</th>
              <th>Trạng thái tin</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.modulePlaceholder}>
                  Không có tin tuyển dụng phù hợp.
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id}>
                  <td data-label="STT">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td data-label="Tiêu đề">{row.title}</td>
                  <td data-label="Ngày đăng">{formatDateVi(row.createdAt)}</td>
                  <td data-label="Hạn tuyển dụng">{formatDateVi(row.deadlineAt)}</td>
                  <td data-label="Số lượng tuyển">{row.recruitmentCount}</td>
                  <td data-label="Số lượng ứng viên">{row.applicantCount}</td>
                  <td data-label="Trạng thái tin">{DOANHNGHIEP_UNG_VIEN_STATUS_LABEL[row.status]}</td>
                  <td data-label="Thao tác">
                    <a className={adminStyles.detailLink} href={`/doanhnghiep/ung-vien/${row.id}`}>
                      Xem chi tiết
                    </a>
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
