import type { SinhVienTraCuuUngTuyenJobDetail } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen-detail";
import {
  APPLY_BUTTON_LABEL_APPLIED,
  APPLY_BUTTON_LABEL_DEFAULT,
  workTypeLabel
} from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen-detail";
import { formatDateVi } from "@/lib/utils/sinhvien-tra-cuu-ung-tuyen-detail";
import adminStyles from "../../../../admin/styles/dashboard.module.css";
import styles from "../../../styles/dashboard.module.css";

type Props = {
  job: SinhVienTraCuuUngTuyenJobDetail;
  onOpenApply: () => void;
};

export default function JobDetailInfo({ job, onOpenApply }: Props) {
  return (
    <section className={styles.card} style={{ padding: "18px 22px" }}>
      <div className={adminStyles.detailSectionTitle}>Thông tin tuyển dụng</div>
      <table className={adminStyles.viewModalDetailTable}>
        <tbody>
          <tr><th scope="row">Tiêu đề</th><td>{job.title}</td></tr>
          <tr><th scope="row">Tên doanh nghiệp</th><td>{job.enterprise.companyName}</td></tr>
          <tr><th scope="row">MST</th><td>{job.enterprise.taxCode}</td></tr>
          <tr><th scope="row">Lĩnh vực</th><td>{job.enterprise.businessFields}</td></tr>
          <tr><th scope="row">Địa điểm trụ sở chính</th><td>{job.enterprise.headquartersAddress}</td></tr>
          <tr><th scope="row">Giới thiệu công ty</th><td>{job.enterprise.intro || "—"}</td></tr>
          <tr><th scope="row">Website</th><td>{job.enterprise.website || "—"}</td></tr>
          <tr><th scope="row">Mức lương</th><td>{job.salary}</td></tr>
          <tr><th scope="row">Chuyên môn</th><td>{job.expertise}</td></tr>
          <tr><th scope="row">Yêu cầu kinh nghiệm</th><td>{job.experienceRequirement}</td></tr>
          <tr><th scope="row">Số lượng tuyển dụng</th><td>{job.recruitmentCount}</td></tr>
          <tr><th scope="row">Hình thức làm việc</th><td>{workTypeLabel[job.workType]}</td></tr>
          <tr><th scope="row">Hạn tuyển dụng</th><td>{formatDateVi(job.deadlineAt)}</td></tr>
          <tr><th scope="row">Mô tả công việc</th><td style={{ whiteSpace: "pre-wrap" }}>{job.jobDescription}</td></tr>
          <tr><th scope="row">Yêu cầu ứng viên</th><td style={{ whiteSpace: "pre-wrap" }}>{job.candidateRequirements}</td></tr>
          <tr><th scope="row">Quyền lợi</th><td style={{ whiteSpace: "pre-wrap" }}>{job.benefits}</td></tr>
          <tr><th scope="row">Địa điểm làm việc</th><td>{job.workLocation}</td></tr>
          <tr><th scope="row">Thời gian làm việc</th><td>{job.workTime}</td></tr>
          <tr><th scope="row">Cách thức ứng tuyển</th><td>{job.applicationMethod || "Ứng tuyển trực tiếp trên hệ thống"}</td></tr>
        </tbody>
      </table>
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}
          onClick={onOpenApply}
          disabled={!job.canApply || job.hasApplied}
        >
          {job.hasApplied ? APPLY_BUTTON_LABEL_APPLIED : APPLY_BUTTON_LABEL_DEFAULT}
        </button>
      </div>
    </section>
  );
}
