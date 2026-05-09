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
      <div style={{ marginTop: 10, display: "grid", gap: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#111827", letterSpacing: "-0.01em" }}>{job.title}</h2>
          <div style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>{job.enterprise.companyName || "—"}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {job.enterprise.businessFields ? <span>{job.enterprise.businessFields}</span> : null}
            {job.enterprise.headquartersAddress ? (
              <>
                {job.enterprise.businessFields ? <span> · </span> : null}
                <span>{job.enterprise.headquartersAddress}</span>
              </>
            ) : null}
          </div>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Tóm tắt
          </div>
          <dl className={adminStyles.detailList}>
            <div className={adminStyles.detailListRow}>
              <dt>Mức lương</dt>
              <dd>{job.salary}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Vị trí tuyển dụng</dt>
              <dd>{job.expertise}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Kinh nghiệm</dt>
              <dd>{job.experienceRequirement}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Số lượng</dt>
              <dd>{job.recruitmentCount}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Hình thức</dt>
              <dd>{workTypeLabel[job.workType]}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Hạn tuyển dụng</dt>
              <dd>{formatDateVi(job.deadlineAt)}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Địa điểm làm việc</dt>
              <dd>{job.workLocation}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Thời gian làm việc</dt>
              <dd>{job.workTime}</dd>
            </div>
          </dl>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Mô tả công việc
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, color: "#111827" }}>{job.jobDescription}</div>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Yêu cầu ứng viên
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, color: "#111827" }}>{job.candidateRequirements}</div>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Quyền lợi
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, color: "#111827" }}>{job.benefits}</div>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Thông tin doanh nghiệp
          </div>
          <dl className={adminStyles.detailList}>
            <div className={adminStyles.detailListRow}>
              <dt>Tên doanh nghiệp</dt>
              <dd>{job.enterprise.companyName || "—"}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>MST</dt>
              <dd>{job.enterprise.taxCode || "—"}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Địa điểm trụ sở chính</dt>
              <dd>{job.enterprise.headquartersAddress || "—"}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Giới thiệu công ty</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{job.enterprise.intro || "—"}</dd>
            </div>
            <div className={adminStyles.detailListRow}>
              <dt>Website</dt>
              <dd>{job.enterprise.website || "—"}</dd>
            </div>
          </dl>
        </div>

        <div>
          <div className={adminStyles.detailSectionTitle} style={{ margin: "0 0 8px" }}>
            Cách thức ứng tuyển
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, color: "#111827" }}>
            {job.applicationMethod || "Ứng tuyển trực tiếp trên hệ thống"}
          </div>
        </div>
      </div>
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
