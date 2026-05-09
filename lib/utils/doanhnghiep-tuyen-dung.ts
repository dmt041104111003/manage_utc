import type { JobDetailResponse, JobFormState, JobStatus, WorkType } from "@/lib/types/doanhnghiep-tuyen-dung";
import {
  DOANHNGHIEP_TUYEN_DUNG_COMPANY_WEBSITE_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_COUNT_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_DEADLINE_AT_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_BENEFITS,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_CANDIDATE_REQUIREMENTS,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_COMPANY_WEBSITE,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT_MUST_BE_IN_FUTURE,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERIENCE_REQUIREMENT,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERTISE,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_JOB_DESCRIPTION,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_RECRUITMENT_COUNT,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_SALARY,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TIME,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_LOCATION,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TYPE,
  DOANHNGHIEP_TUYEN_DUNG_EXPERTISE_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_SALARY_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_TITLE_PATTERN,
  DOANHNGHIEP_TUYEN_DUNG_ERROR_TITLE
} from "@/lib/constants/doanhnghiep-tuyen-dung";

export type JobEnterpriseDefaults = { intro: string; website: string };

export function todayDateInputValue(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateVi(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function buildEmptyJobFormState(): JobFormState {
  return {
    title: "",
    companyIntro: "",
    companyWebsite: "",
    salary: "",
    expertise: "",
    experienceRequirement: "",
    recruitmentCount: "",
    workType: "",
    deadlineAt: todayDateInputValue(),
    jobDescription: "",
    candidateRequirements: "",
    benefits: "",
    workLocation: "",
    workTime: "",
    applicationMethod: ""
  };
}

function isWorkType(value: string): value is WorkType {
  return value === "PART_TIME" || value === "FULL_TIME";
}

export function buildJobFormForAdd(args: {
  enterpriseDefaults: JobEnterpriseDefaults;
}): JobFormState {
  return {
    ...buildEmptyJobFormState(),
    companyIntro: args.enterpriseDefaults.intro || "",
    companyWebsite: args.enterpriseDefaults.website || "",
    deadlineAt: todayDateInputValue()
  };
}

export function buildJobFormForEdit(args: {
  detail: JobDetailResponse;
  enterpriseDefaults: JobEnterpriseDefaults;
}): JobFormState {
  const job = args.detail.job;
  const workTypeRaw = (job.workType as string) || "";

  return {
    title: job.title || "",
    companyIntro: job.companyIntro || args.enterpriseDefaults.intro || "",
    companyWebsite: job.companyWebsite || args.enterpriseDefaults.website || "",
    salary: job.salary || "",
    expertise: job.expertise || "",
    experienceRequirement: job.experienceRequirement || "",
    recruitmentCount: job.recruitmentCount != null ? String(job.recruitmentCount) : "",
    workType: isWorkType(workTypeRaw) ? workTypeRaw : "",
    deadlineAt: job.deadlineAt ? new Date(job.deadlineAt).toISOString().slice(0, 10) : todayDateInputValue(),
    jobDescription: job.jobDescription || "",
    candidateRequirements: job.candidateRequirements || "",
    benefits: job.benefits || "",
    workLocation: job.workLocation || "",
    workTime: job.workTime || "",
    applicationMethod: job.applicationMethod || ""
  };
}

export function validateJobForm(
  form: JobFormState
): { isValid: boolean; errors: Record<string, string> } {
  const next: Record<string, string> = {};

  if (!form.title || !DOANHNGHIEP_TUYEN_DUNG_TITLE_PATTERN.test(form.title.trim())) next.title = DOANHNGHIEP_TUYEN_DUNG_ERROR_TITLE;
  if (!form.salary || !DOANHNGHIEP_TUYEN_DUNG_SALARY_PATTERN.test(form.salary.trim())) next.salary = DOANHNGHIEP_TUYEN_DUNG_ERROR_SALARY;
  if (!form.expertise || !DOANHNGHIEP_TUYEN_DUNG_EXPERTISE_PATTERN.test(form.expertise.trim()))
    next.expertise = DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERTISE;
  if (
    !form.experienceRequirement ||
    !DOANHNGHIEP_TUYEN_DUNG_EXPERTISE_PATTERN.test(form.experienceRequirement.trim())
  )
    next.experienceRequirement = DOANHNGHIEP_TUYEN_DUNG_ERROR_EXPERIENCE_REQUIREMENT;
  if (!form.recruitmentCount || !DOANHNGHIEP_TUYEN_DUNG_COUNT_PATTERN.test(form.recruitmentCount.trim()))
    next.recruitmentCount = DOANHNGHIEP_TUYEN_DUNG_ERROR_RECRUITMENT_COUNT;
  if (!form.workType || (form.workType !== "PART_TIME" && form.workType !== "FULL_TIME"))
    next.workType = DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TYPE;

  if (!form.deadlineAt || !DOANHNGHIEP_TUYEN_DUNG_DEADLINE_AT_PATTERN.test(form.deadlineAt)) {
    next.deadlineAt = DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT;
  } else {
    const deadline = new Date(`${form.deadlineAt}T00:00:00.000Z`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!(deadline.getTime() > today.getTime()))
      next.deadlineAt = DOANHNGHIEP_TUYEN_DUNG_ERROR_DEADLINE_AT_MUST_BE_IN_FUTURE;
  }

  if (!form.jobDescription.trim()) next.jobDescription = DOANHNGHIEP_TUYEN_DUNG_ERROR_JOB_DESCRIPTION;
  if (!form.candidateRequirements.trim())
    next.candidateRequirements = DOANHNGHIEP_TUYEN_DUNG_ERROR_CANDIDATE_REQUIREMENTS;
  if (!form.benefits.trim()) next.benefits = DOANHNGHIEP_TUYEN_DUNG_ERROR_BENEFITS;
  if (!form.workLocation.trim() || form.workLocation.trim().length > 255)
    next.workLocation = DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_LOCATION;
  if (!form.workTime.trim()) next.workTime = DOANHNGHIEP_TUYEN_DUNG_ERROR_WORK_TIME;

  if (
    form.companyWebsite.trim() &&
    !DOANHNGHIEP_TUYEN_DUNG_COMPANY_WEBSITE_PATTERN.test(form.companyWebsite.trim())
  )
    next.companyWebsite = DOANHNGHIEP_TUYEN_DUNG_ERROR_COMPANY_WEBSITE;

  return { isValid: Object.keys(next).length === 0, errors: next };
}

export function buildJobCreatePayload(form: JobFormState) {
  return {
    title: form.title.trim(),
    companyIntro: form.companyIntro.trim() || null,
    companyWebsite: form.companyWebsite.trim() || null,
    salary: form.salary.trim(),
    expertise: form.expertise.trim(),
    experienceRequirement: form.experienceRequirement.trim(),
    recruitmentCount: Number(form.recruitmentCount.trim()),
    workType: form.workType as WorkType,
    deadlineAt: form.deadlineAt,
    jobDescription: form.jobDescription.trim(),
    candidateRequirements: form.candidateRequirements.trim(),
    benefits: form.benefits.trim(),
    workLocation: form.workLocation.trim(),
    workTime: form.workTime.trim(),
    applicationMethod: form.applicationMethod.trim() || null
  };
}

export function buildJobEditPayload(form: JobFormState) {
  return buildJobCreatePayload(form);
}

export function canEditStatus(status: JobStatus): boolean {
  return status === "PENDING" || status === "REJECTED";
}

export function canStopStatus(status: JobStatus): boolean {
  return status !== "STOPPED";
}

