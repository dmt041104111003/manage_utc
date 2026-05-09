"use client";

import { useEffect, useState } from "react";
import styles from "../../styles/dashboard.module.css";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import MessagePopup from "../../../components/MessagePopup";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import type { SinhVienApplyDraft, SinhVienTraCuuUngTuyenJobDetail } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen-detail";
import {
  SINHVIEN_TRA_CUU_UNG_TUYEN_BACK_LINK_TEXT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_DETAIL_ERROR_DEFAULT,
  SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE,
  SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_ERROR_DEFAULT
} from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen-detail";
import {
  buildSinhVienTraCuuUngTuyenApplyPayload,
  buildSinhVienTraCuuUngTuyenApplyUrl,
  fetchSinhVienHoSoProfileForApply,
  fetchSinhVienTraCuuUngTuyenDetail,
  getCvMimeValidationError,
  getSinhVienTraCuuUngTuyenOpenApplyErrorMessage,
  getSinhVienTraCuuUngTuyenSubmitErrorMessage,
  getSinhVienTraCuuUngTuyenSubmitSuccessMessage,
  validateSinhVienApplyDraft
} from "@/lib/utils/sinhvien-tra-cuu-ung-tuyen-detail";
import JobDetailInfo from "./components/JobDetailInfo";
import ApplyFormPopup from "./components/ApplyFormPopup";

export default function SinhVienJobDetailPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [job, setJob] = useState<SinhVienTraCuuUngTuyenJobDetail | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvMime, setCvMime] = useState<string | null>(null);
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [removeCv, setRemoveCv] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSinhVienTraCuuUngTuyenDetail(jobId);
      setJob(data.item ?? null);
    } catch (e: any) {
      setError(e?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_LOAD_DETAIL_ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfileForApply() {
    const profile = await fetchSinhVienHoSoProfileForApply();
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setEmail(profile.email ?? "");
    setIntro(profile.intro ?? "");
    setCvFileName(profile.cvFileName ?? null);
    setCvMime(profile.cvMime ?? null);
    setCvBase64(profile.cvBase64 ?? null);
    setRemoveCv(false);
    setFieldErrors({});
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function openApply() {
    try {
      await loadProfileForApply();
      setApplyOpen(true);
    } catch (e: any) {
      setToast(getSinhVienTraCuuUngTuyenOpenApplyErrorMessage(e));
    }
  }

  async function onChooseCv(file: File | null) {
    if (!file) return;
    const guessed = file.type || "";
    const guessedError = getCvMimeValidationError(guessed);
    if (guessedError) {
      setFieldErrors((prev) => ({ ...prev, cv: guessedError }));
      return;
    }
    const payload = await readFileAsBase64Payload(file);
    const payloadError = getCvMimeValidationError(payload.mime);
    if (payloadError) {
      setFieldErrors((prev) => ({ ...prev, cv: payloadError }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, cv: "" }));
    setCvFileName(file.name);
    setCvMime(payload.mime);
    setCvBase64(payload.base64);
    setRemoveCv(false);
  }

  async function submitApply() {
    const draft: SinhVienApplyDraft = {
      phone,
      email,
      intro,
      cvFileName,
      cvMime,
      cvBase64,
      removeCv
    };

    const { isValid, errors } = validateSinhVienApplyDraft(draft);
    setFieldErrors(errors);
    if (!isValid) return;

    setBusy(true);
    try {
      const res = await fetch(buildSinhVienTraCuuUngTuyenApplyUrl(jobId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSinhVienTraCuuUngTuyenApplyPayload(draft))
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (data?.errors && typeof data.errors === "object") setFieldErrors(data.errors);
        throw new Error(data?.message || SINHVIEN_TRA_CUU_UNG_TUYEN_SUBMIT_ERROR_DEFAULT);
      }
      setApplyOpen(false);
      setToast(getSinhVienTraCuuUngTuyenSubmitSuccessMessage(data?.message));
      await loadDetail();
    } catch (e: any) {
      setToast(getSinhVienTraCuuUngTuyenSubmitErrorMessage(e?.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{SINHVIEN_TRA_CUU_UNG_TUYEN_TITLE}</h1>
        <p className={styles.subtitle}>
          <a className={adminStyles.detailLink} href="/sinhvien/tra-cuu-ung-tuyen">
            {SINHVIEN_TRA_CUU_UNG_TUYEN_BACK_LINK_TEXT}
          </a>
        </p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : job ? (
        <JobDetailInfo job={job} onOpenApply={() => void openApply()} />
      ) : null}

      {applyOpen ? (
        <ApplyFormPopup
          busy={busy}
          fullName={fullName}
          phone={phone}
          email={email}
          intro={intro}
          cvFileName={cvFileName}
          cvMime={cvMime}
          cvBase64={cvBase64}
          removeCv={removeCv}
          fieldErrors={fieldErrors}
          onPhoneChange={setPhone}
          onEmailChange={setEmail}
          onIntroChange={setIntro}
          onChooseCv={(f) => void onChooseCv(f)}
          onRemoveCv={() => {
            setRemoveCv(true);
            setCvBase64(null);
            setCvMime(null);
            setCvFileName(null);
          }}
          onClose={() => setApplyOpen(false)}
          onSubmit={() => void submitApply()}
        />
      ) : null}

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

