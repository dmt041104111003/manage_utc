import type { JobFormState } from "@/lib/types/doanhnghiep-tuyen-dung";
import formStyles from "../../../auth/styles/register.module.css";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  form: JobFormState;
  fieldErrors: Record<string, string>;
  disabled: boolean;
  onChange: (updates: Partial<JobFormState>) => void;
  facultyOptions: string[];
};

function tomorrowDateInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TuyenDungJobFormFields({ form, fieldErrors, disabled, onChange, facultyOptions }: Props) {
  const minDeadlineAt = tomorrowDateInputValue();
  const [facultyOpen, setFacultyOpen] = useState(false);
  const facultyRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!facultyOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = facultyRootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setFacultyOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [facultyOpen]);

  const selectedFaculties = useMemo(() => {
    const set = new Set(form.allowedFaculties.map((x) => String(x || "").trim()).filter(Boolean));
    return Array.from(set.values());
  }, [form.allowedFaculties]);

  const facultySummary = selectedFaculties.length ? selectedFaculties.join(", ") : "Chọn ngành/khoa";

  return (
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, marginTop: 10 }}>
      <div className={formStyles.field}>
        <label className={formStyles.label}>Giới thiệu về công ty</label>
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
            Vị trí tuyển dụng <span className={formStyles.required}>*</span>
          </label>
          <input
            className={formStyles.input}
            value={form.expertise}
            onChange={(e) => onChange({ expertise: e.target.value })}
            placeholder="Nhập vị trí tuyển dụng"
          />
          {fieldErrors.expertise ? <p className={formStyles.error}>{fieldErrors.expertise}</p> : null}
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label}>
          Ngành/Khoa <span className={formStyles.required}>*</span>
        </label>
        <div ref={facultyRootRef} className={formStyles.comboRoot}>
          <button
            type="button"
            className={`${formStyles.comboControl} ${facultyOpen ? formStyles.comboControlOpen : ""}`}
            aria-haspopup="listbox"
            aria-expanded={facultyOpen}
            onClick={() => setFacultyOpen((v) => !v)}
            title={!facultyOptions.length ? "Chưa có danh sách khoa." : undefined}
          >
            <span className={formStyles.comboValue}>
              {selectedFaculties.length ? facultySummary : <span className={formStyles.comboPlaceholder}>{facultySummary}</span>}
            </span>
            <span className={formStyles.comboCaret} aria-hidden="true">
              ▾
            </span>
          </button>

          {facultyOpen ? (
            <div className={formStyles.comboDropdown} role="dialog" aria-label="Chọn ngành/khoa">
              <div className={formStyles.comboList} role="listbox" aria-multiselectable="true">
                {facultyOptions.length ? (
                  facultyOptions.map((f) => {
                    const checked = selectedFaculties.includes(f);
                    return (
                      <label
                        key={f}
                        className={formStyles.comboOption}
                        style={{ display: "flex", gap: 10, alignItems: "center" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selectedFaculties.filter((x) => x !== f)
                              : [...selectedFaculties, f];
                            onChange({ allowedFaculties: next });
                          }}
                        />
                        <span className={formStyles.comboOptionText}>{f}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className={formStyles.comboEmpty}>Không có dữ liệu khoa.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        {fieldErrors.allowedFaculties ? <p className={formStyles.error}>{fieldErrors.allowedFaculties}</p> : null}
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
          min={minDeadlineAt}
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
