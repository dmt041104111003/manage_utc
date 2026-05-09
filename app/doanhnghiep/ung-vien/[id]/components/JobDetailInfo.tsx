import type { JobDetail } from "@/lib/types/doanhnghiep-ung-vien-detail";
import { workTypeLabel } from "@/lib/constants/doanhnghiep-ung-vien-detail";
import adminStyles from "../../../../admin/styles/dashboard.module.css";

type Props = {
  job: JobDetail;
};

export default function JobDetailInfo({ job }: Props) {
  return (
    <section className={adminStyles.detailCard} style={{ maxWidth: "none" }}>
      <div className={adminStyles.detailSectionTitle}>Thông tin tin tuyển dụng</div>
      <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 10 }}>
        <tbody>
          <tr>
            <th scope="row">Tiêu đề</th>
            <td>{job.title}</td>
          </tr>
          <tr>
            <th scope="row">Mức lương</th>
            <td>{job.salary}</td>
          </tr>
          <tr>
            <th scope="row">Chuyên môn</th>
            <td>{job.expertise}</td>
          </tr>
          <tr>
            <th scope="row">Yêu cầu kinh nghiệm</th>
            <td>{job.experienceRequirement}</td>
          </tr>
          <tr>
            <th scope="row">Hình thức làm việc</th>
            <td>{workTypeLabel[job.workType]}</td>
          </tr>
          <tr>
            <th scope="row">Mô tả công việc</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{job.jobDescription}</td>
          </tr>
          <tr>
            <th scope="row">Yêu cầu ứng viên</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{job.candidateRequirements}</td>
          </tr>
          <tr>
            <th scope="row">Địa điểm làm việc</th>
            <td>{job.workLocation}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
