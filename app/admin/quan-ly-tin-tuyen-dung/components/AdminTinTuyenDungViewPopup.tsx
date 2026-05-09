"use client";

import type { JobDetailResponse, JobListItem } from "@/lib/types/admin-quan-ly-tin-tuyen-dung";
import { statusLabel, workTypeLabel } from "@/lib/constants/admin-quan-ly-tin-tuyen-dung";
import { formatDateVi } from "@/lib/utils/admin-quan-ly-tin-tuyen-dung";
import styles from "../../styles/dashboard.module.css";

type Props = {
  viewTarget: JobListItem | null;
  viewLoading: boolean;
  viewDetail: JobDetailResponse | null;
  onClose: () => void;
};

export default function AdminTinTuyenDungViewPopup(props: Props) {
  const { viewTarget, viewLoading, viewDetail, onClose } = props;
  if (!viewTarget && !viewLoading) return null;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="job-view-title">
      <div className={`${styles.modal} ${styles.modalExtraWide}`}>
        <h2 id="job-view-title">Xem chi tiết tin tuyển dụng</h2>
        {viewLoading ? <p>Đang tải…</p> : null}
        {viewDetail ? (
          <div>
            <table className={styles.viewModalDetailTable}>
              <tbody>
                <tr>
                  <th scope="row">Tiêu đề</th>
                  <td style={{ fontWeight: 700 }}>{viewDetail.job.title}</td>
                </tr>
                <tr>
                  <th scope="row">Thông tin doanh nghiệp</th>
                  <td />
                </tr>
                <tr>
                  <th scope="row">Tên doanh nghiệp</th>
                  <td>{viewDetail.enterprise.companyName || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">MST</th>
                  <td>{viewDetail.enterprise.taxCode || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Lĩnh vực</th>
                  <td>{viewDetail.enterprise.businessFields || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Địa điểm trụ sở chính</th>
                  <td>{viewDetail.enterprise.headquartersAddress || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Giới thiệu về công ty</th>
                  <td>{viewDetail.job.companyIntro || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Website</th>
                  <td>
                    {viewDetail.job.companyWebsite ? (
                      <a href={viewDetail.job.companyWebsite} target="_blank" rel="noopener noreferrer">
                        {viewDetail.job.companyWebsite}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Mức lương</th>
                  <td>{viewDetail.job.salary || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Chuyên môn</th>
                  <td>{viewDetail.job.expertise || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Yêu cầu kinh nghiệm</th>
                  <td>{viewDetail.job.experienceRequirement || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Số lượng tuyển dụng</th>
                  <td>{viewDetail.job.recruitmentCount}</td>
                </tr>
                <tr>
                  <th scope="row">Hình thức làm việc</th>
                  <td>{workTypeLabel[viewDetail.job.workType]}</td>
                </tr>
                <tr>
                  <th scope="row">Hạn tuyển dụng</th>
                  <td>{formatDateVi(viewDetail.job.deadlineAt)}</td>
                </tr>
                <tr>
                  <th scope="row">Mô tả công việc</th>
                  <td>{viewDetail.job.jobDescription || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Yêu cầu ứng viên</th>
                  <td>{viewDetail.job.candidateRequirements || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Quyền lợi</th>
                  <td>{viewDetail.job.benefits || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Địa điểm làm việc</th>
                  <td>{viewDetail.job.workLocation || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Thời gian làm việc</th>
                  <td>{viewDetail.job.workTime || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Cách thức ứng tuyển</th>
                  <td>{viewDetail.job.applicationMethod || "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Trạng thái hiện tại của tin</th>
                  <td>{statusLabel[viewDetail.job.status]}</td>
                </tr>
                {viewDetail.job.status === "REJECTED" ? (
                  <tr>
                    <th scope="row">Lý do từ chối</th>
                    <td>{viewDetail.job.rejectionReason || "—"}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
