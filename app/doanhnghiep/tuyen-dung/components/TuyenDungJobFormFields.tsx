import type { JobFormState } from "@/lib/types/doanhnghiep-tuyen-dung";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  form: JobFormState;
  fieldErrors: Record<string, string>;
  disabled: boolean;
  onChange: (updates: Partial<JobFormState>) => void;
};

export default function TuyenDungJobFormFields({ form, fieldErrors, disabled, onChange }: Props) {
  return (
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, marginTop: 10 }}>
      <div className={formStyles.field}>
        <label className={formStyles.label}>Thông tin doanh nghiệp</label>
        <textarea
          className={formStyles.input as string}
          value={form.companyIntro}
          onChange={(e) => onChange({ companyIntro: e.target.value })}
          placeholder="Giới thiệu về công ty"
        />
        {fieldErrors.companyIntro ? <p className={formStyles.error}>{fieldErrors.companyIntro}</p> : null}
        <input
          className={formStyles.input}
          value={form.companyWebsite}
          onChange={(e) => onChange({ companyWebsite: e.target.value })}
          placeholder="Website (nếu có)"
        />
        {fieldErrors.companyWebsite ? <p className={formStyles.error}>{fieldErrors.companyWebsite}</p> : null}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Tiêu đề <span className={formStyles.required}>*</span>
        </label>
        <input
          className={formStyles.input}
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Nhập tiêu đề tin tuyển dụng"
        />
        {fieldErrors.title ? <p className={formStyles.error}>{fieldErrors.title}</p> : null}
      </div>

      <div className={formStyles.grid2}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Mức lương <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.salary}
            onChange={(e) => onChange({ salary: e.target.value })}
            placeholder="Nhập mức lương (VD: 1000-1500)"
          />
          {fieldErrors.salary ? <p className={formStyles.error}>{fieldErrors.salary}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Chuyên môn <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.expertise}
            onChange={(e) => onChange({ expertise: e.target.value })}
            placeholder="Nhập chuyên môn"
          />
          {fieldErrors.expertise ? <p className={formStyles.error}>{fieldErrors.expertise}</p> : null}
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Yêu cầu kinh nghiệm <span className={formStyles.required}>*</span>
        </label>
        <input
          className={formStyles.input}
          value={form.experienceRequirement}
          onChange={(e) => onChange({ experienceRequirement: e.target.value })}
          placeholder="Nhập yêu cầu kinh nghiệm"
        />
        {fieldErrors.experienceRequirement ? <p className={formStyles.error}>{fieldErrors.experienceRequirement}</p> : null}
      </div>

      <div className={formStyles.grid2}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Số lượng tuyển dụng <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.recruitmentCount}
            onChange={(e) => onChange({ recruitmentCount: e.target.value })}
            placeholder="Nhập số lượng tuyển dụng"
          />
          {fieldErrors.recruitmentCount ? <p className={formStyles.error}>{fieldErrors.recruitmentCount}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Hình thức làm việc <span className={formStyles.required}>*</span>
          </label>
          <select
            className={formStyles.select}
            value={form.workType}
            onChange={(e) => onChange({ workType: e.target.value as JobFormState["workType"] })}
          >
            <option value="">Chọn...</option>
            <option value="PART_TIME">part-time</option>
            <option value="FULL_TIME">full-time</option>
          </select>
          {fieldErrors.workType ? <p className={formStyles.error}>{fieldErrors.workType}</p> : null}
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Hạn tuyển dụng <span className={formStyles.required}>*</span>
        </label>
        <input
          className={formStyles.input}
          type="date"
          value={form.deadlineAt}
          onChange={(e) => onChange({ deadlineAt: e.target.value })}
          placeholder="Chọn ngày"
        />
        {fieldErrors.deadlineAt ? <p className={formStyles.error}>{fieldErrors.deadlineAt}</p> : null}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Mô tả công việc <span className={formStyles.required}>*</span>
        </label>
        <textarea
          className={formStyles.input as string}
          value={form.jobDescription}
          onChange={(e) => onChange({ jobDescription: e.target.value })}
          placeholder="Nhập mô tả công việc"
        />
        {fieldErrors.jobDescription ? <p className={formStyles.error}>{fieldErrors.jobDescription}</p> : null}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Yêu cầu ứng viên <span className={formStyles.required}>*</span>
        </label>
        <textarea
          className={formStyles.input as string}
          value={form.candidateRequirements}
          onChange={(e) => onChange({ candidateRequirements: e.target.value })}
          placeholder="Nhập yêu cầu ứng viên"
        />
        {fieldErrors.candidateRequirements ? <p className={formStyles.error}>{fieldErrors.candidateRequirements}</p> : null}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Quyền lợi <span className={formStyles.required}>*</span>
        </label>
        <textarea
          className={formStyles.input as string}
          value={form.benefits}
          onChange={(e) => onChange({ benefits: e.target.value })}
          placeholder="Nhập quyền lợi"
        />
        {fieldErrors.benefits ? <p className={formStyles.error}>{fieldErrors.benefits}</p> : null}
      </div>

      <div className={formStyles.grid2}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Địa điểm làm việc <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.workLocation}
            onChange={(e) => onChange({ workLocation: e.target.value })}
            placeholder="Nhập địa điểm làm việc"
          />
          {fieldErrors.workLocation ? <p className={formStyles.error}>{fieldErrors.workLocation}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Thời gian làm việc <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.workTime}
            onChange={(e) => onChange({ workTime: e.target.value })}
            placeholder="Nhập thời gian làm việc"
          />
          {fieldErrors.workTime ? <p className={formStyles.error}>{fieldErrors.workTime}</p> : null}
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>Cách thức ứng tuyển</label>
        <textarea
          className={formStyles.input as string}
          value={form.applicationMethod}
          onChange={(e) => onChange({ applicationMethod: e.target.value })}
          placeholder="Nhập cách thức ứng tuyển"
        />
      </div>
    </fieldset>
  );
}
