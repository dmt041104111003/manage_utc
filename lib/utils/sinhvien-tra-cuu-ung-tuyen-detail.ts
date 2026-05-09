import type {
  SinhVienApplyDraft,
  SinhVienApplyProfile,
  SinhVienTraCuuUngTuyenJobDetail,
  SinhVienApplyDraft as Draft
} from "@/lib/types/sinhvien-tra-cuu-ung-tuyen-detail";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import {
  CV_ALLOWED_MIMES,
  PHONE_PATTERN,
  SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_INVALID,
  SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_REQUIRED,
  SINHVIEN_TRA_CUU_UNG_TUYEN_OPEN_APPLY_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_PROFILE_ENDPOINT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_EMAIL,
  SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_INTRO,
  SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_PHONE,
  SINHVIEN_TRA_CUU_UNG_TUYEN_DETAIL_ENDPOINT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_DETAIL_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_PROFILE_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_SUCCESS_DEFAULT
} from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen-detail";

export function formatDateVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export function buildSinhVienTraCuuUngTuyenDetailUrl(jobId: string): string {
  return `${SINHVIEN_TRA_CUU_UNG_TUYEN_DETAIL_ENDPOINT}/${jobId}`;
}

export function buildSinhVienTraCuuUngTuyenApplyUrl(jobId: string): string {
  return `${SINHVIEN_TRA_CUU_UNG_TUYEN_DETAIL_ENDPOINT}/${jobId}/apply`;
}

export function fetchSinhVienTraCuuUngTuyenDetail(jobId: string): Promise<{ item: SinhVienTraCuuUngTuyenJobDetail }> {
  return fetch(buildSinhVienTraCuuUngTuyenDetailUrl(jobId))
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_DETAIL_ERROR_DEFAULT);
      return data as { item: SinhVienTraCuuUngTuyenJobDetail };
    })
    .then((data) => ({ item: data.item }));
}

export function fetchSinhVienHoSoProfileForApply(): Promise<SinhVienApplyProfile> {
  return fetch(SINHVIEN_TRA_CUU_UNG_TUYEN_PROFILE_ENDPOINT)
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_PROFILE_ERROR_DEFAULT);
      const item = data.item ?? {};
      return {
        fullName: String(item.fullName || ""),
        phone: item.phone ?? null,
        email: item.email ?? null,
        intro: item.intro ?? null,
        cvFileName: item.cvFileName ?? null,
        cvMime: item.cvMime ?? null,
        cvBase64: item.cvBase64 ?? null
      } satisfies SinhVienApplyProfile;
    })
    .catch(() => {
      throw new Error(SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_PROFILE_ERROR_DEFAULT);
    });
}

export function isCvMimeAllowed(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (CV_ALLOWED_MIMES as readonly string[]).includes(mime);
}

export function getCvMimeValidationError(mime: string | null | undefined): string | null {
  if (!isCvMimeAllowed(mime)) return SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_INVALID;
  return null;
}

export function validateSinhVienApplyDraft(draft: SinhVienApplyDraft): { isValid: boolean; errors: Record<string, string> } {
  const next: Record<string, string> = {};

  if (!PHONE_PATTERN.test(draft.phone.trim())) next.phone = SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_PHONE;
  if (!AUTH_EMAIL_REGISTER_PATTERN.test(draft.email.trim().toLowerCase())) next.email = SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_EMAIL;
  if (!draft.intro.trim()) next.intro = SINHVIEN_TRA_CUU_UNG_TUYEN_VALIDATE_ERROR_INTRO;
  if (!draft.cvBase64 || !draft.cvMime || !draft.cvFileName || draft.removeCv) next.cv = SINHVIEN_TRA_CUU_UNG_TUYEN_CV_ERROR_REQUIRED;

  return { isValid: Object.keys(next).length === 0, errors: next };
}

export function buildSinhVienTraCuuUngTuyenApplyPayload(draft: Draft): {
  phone: string;
  email: string;
  intro: string;
  cvFileName: string | null;
  cvMime: string | null;
  cvBase64: string | null;
  removeCv: boolean;
} {
  return {
    phone: draft.phone.trim(),
    email: draft.email.trim().toLowerCase(),
    intro: draft.intro.trim(),
    cvFileName: draft.cvFileName,
    cvMime: draft.cvMime,
    cvBase64: draft.cvBase64,
    removeCv: draft.removeCv
  };
}

export function getSinhVienTraCuuUngTuyenOpenApplyErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || SINHVIEN_TRA_CUU_UNG_TUYEN_OPEN_APPLY_ERROR_DEFAULT;
  return SINHVIEN_TRA_CUU_UNG_TUYEN_OPEN_APPLY_ERROR_DEFAULT;
}

export function getSinhVienTraCuuUngTuyenSubmitSuccessMessage(message?: string): string {
  return message || SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_SUCCESS_DEFAULT;
}

export function getSinhVienTraCuuUngTuyenSubmitErrorMessage(message?: string): string {
  return message || SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_ERROR_DEFAULT;
}

