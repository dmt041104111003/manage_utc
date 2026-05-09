"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/dashboard.module.css";
import adminStyles from "../../admin/styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";
import { readFileAsBase64Payload } from "@/lib/utils/file-payload";
import type {
  InternshipStatus,
  Report,
  SupervisorInfo,
  StatusHistoryEvent
} from "@/lib/types/sinhvien-bao-cao-thuc-tap";
import {
  SINHVIEN_BAO_CAO_THUC_TAP_ENDPOINT,
  SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_SUCCESS_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT,
  SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_SUCCESS_DEFAULT,
  BCTT_ERROR_INVALID_MIME,
  BCTT_ERROR_REQUIRED_FILE_BEFORE_EDIT,
  BCTT_ERROR_REQUIRED_FILE_BEFORE_SUBMIT
} from "@/lib/constants/sinhvien-bao-cao-thuc-tap";
import { getSinhVienBaoCaoStatusHintText, isAllowedBcttMime } from "@/lib/utils/sinhvien-bao-cao-thuc-tap";
import { getOrFetchCached, hasCachedValue } from "@/lib/utils/client-query-cache";
import BaoCaoThucTapStatusSection from "./components/BaoCaoThucTapStatusSection";
import BaoCaoThucTapSupervisorSection from "./components/BaoCaoThucTapSupervisorSection";
import BaoCaoThucTapStatusHistorySection from "./components/BaoCaoThucTapStatusHistorySection";
import BaoCaoThucTapResultSection from "./components/BaoCaoThucTapResultSection";
const BaoCaoThucTapUploadPopup = dynamic(() => import("./components/BaoCaoThucTapUploadPopup"), { ssr: false });
const BaoCaoThucTapEditPopup = dynamic(() => import("./components/BaoCaoThucTapEditPopup"), { ssr: false });

export default function SinhvienBaoCaoThucTapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [internshipStatus, setInternshipStatus] = useState<InternshipStatus>("NOT_STARTED");
  const [supervisor, setSupervisor] = useState<SupervisorInfo | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEvent[]>([]);
  const [canSubmitReport, setCanSubmitReport] = useState(false);
  const [canEditReport, setCanEditReport] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileMime, setSelectedFileMime] = useState<string | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [deleteLocalFile, setDeleteLocalFile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function load(opts?: { force?: boolean; silent?: boolean }) {
    const force = Boolean(opts?.force);
    const silent = Boolean(opts?.silent);
    try {
      if (!silent && (force || !hasCachedValue("sv:bao-cao-thuc-tap:me"))) setLoading(true);
      setError("");
      const data = await getOrFetchCached<any>(
        "sv:bao-cao-thuc-tap:me",
        async () => {
          const res = await fetch(SINHVIEN_BAO_CAO_THUC_TAP_ENDPOINT);
          const payload = await res.json();
          if (!res.ok || !payload?.success) throw new Error(payload?.message || SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT);
          return payload;
        },
        { force }
      );
      const item = data.item;
      setInternshipStatus(item.internshipStatus);
      setSupervisor(item.supervisor ?? null);
      setReport(item.report ?? null);
      setStatusHistory(Array.isArray(item.statusHistory) ? item.statusHistory : []);
      setCanSubmitReport(Boolean(item.ui?.canSubmitReport));
      setCanEditReport(Boolean(item.ui?.canEditReport));
    } catch (e: any) {
      setError(e?.message || SINHVIEN_BAO_CAO_THUC_TAP_LOAD_ERROR_DEFAULT);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load({ force: true, silent: true });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canShowResults = internshipStatus === "COMPLETED";

  const statusHint = useMemo(() => {
    return getSinhVienBaoCaoStatusHintText({
      canShowResults,
      canSubmitReport,
      canEditReport,
      internshipStatus,
      report
    });
  }, [canShowResults, canSubmitReport, canEditReport, internshipStatus, report?.supervisorRejectReason, report?.reviewStatus, report]);

  function resetUploadState() {
    setSelectedFileName(null);
    setSelectedFileMime(null);
    setSelectedFileBase64(null);
    setDeleteLocalFile(false);
    setFieldErrors({});
  }

  async function onChooseFile(file: File | null) {
    if (!file) return;
    const payload = await readFileAsBase64Payload(file);
    const mime = payload.mime;
    if (!isAllowedBcttMime(mime)) {
      setFieldErrors((prev) => ({ ...prev, file: BCTT_ERROR_INVALID_MIME }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, file: "" }));
    setSelectedFileName(file.name);
    setSelectedFileMime(mime);
    setSelectedFileBase64(payload.base64);
    setDeleteLocalFile(false);
  }

  async function submitNewReport() {
    if (!selectedFileBase64 || !selectedFileMime || !selectedFileName || deleteLocalFile) {
      setFieldErrors({ file: BCTT_ERROR_REQUIRED_FILE_BEFORE_SUBMIT });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sinhvien/bao-cao-thuc-tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportFileName: selectedFileName,
          reportMime: selectedFileMime,
          reportBase64: selectedFileBase64
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT);
      setUploadOpen(false);
      resetUploadState();
      setToast(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_SUCCESS_DEFAULT);
      await load({ force: true });
    } catch (e: any) {
      setFieldErrors({ file: e?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_NEW_ERROR_DEFAULT });
    } finally {
      setBusy(false);
    }
  }

  async function submitEditReport() {
    if (!selectedFileBase64 || !selectedFileMime || !selectedFileName || deleteLocalFile) {
      setFieldErrors({ file: BCTT_ERROR_REQUIRED_FILE_BEFORE_EDIT });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sinhvien/bao-cao-thuc-tap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportFileName: selectedFileName,
          reportMime: selectedFileMime,
          reportBase64: selectedFileBase64
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT);
      setEditOpen(false);
      resetUploadState();
      setToast(data?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_SUCCESS_DEFAULT);
      await load({ force: true });
    } catch (e: any) {
      setFieldErrors({ file: e?.message || SINHVIEN_BAO_CAO_THUC_TAP_SUBMIT_EDIT_ERROR_DEFAULT });
    } finally {
      setBusy(false);
    }
  }

  const reportFileLink = report?.reportUrl || null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Theo dõi tiến độ thực tập</h1>
        <p className={styles.subtitle}>
          Theo dõi Giảng viên hướng dẫn, trạng thái thực tập và lịch sử thay đổi trạng thái (không cập nhật trạng thái).
        </p>
      </header>

      {error ? <p className={adminStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <>
          <BaoCaoThucTapStatusSection
            internshipStatus={internshipStatus}
            statusHint={statusHint}
            canSubmitReport={canSubmitReport}
            canEditReport={canEditReport}
            hasReport={!!report}
            busy={busy}
            onOpenUpload={() => { resetUploadState(); setUploadOpen(true); }}
            onOpenEdit={() => { resetUploadState(); setEditOpen(true); }}
          />

          {canShowResults ? (
            <BaoCaoThucTapResultSection report={report} reportFileLink={reportFileLink} />
          ) : null}

          <BaoCaoThucTapSupervisorSection supervisor={supervisor} />

          <BaoCaoThucTapStatusHistorySection statusHistory={statusHistory} />
        </>
      )}

      {uploadOpen ? (
        <BaoCaoThucTapUploadPopup
          busy={busy}
          fieldError={fieldErrors.file ?? ""}
          onChooseFile={(f) => void onChooseFile(f)}
          onClose={() => setUploadOpen(false)}
          onSubmit={() => void submitNewReport()}
        />
      ) : null}

      {editOpen ? (
        <BaoCaoThucTapEditPopup
          busy={busy}
          report={report}
          reportFileLink={reportFileLink}
          selectedFileBase64={selectedFileBase64}
          deleteLocalFile={deleteLocalFile}
          fieldError={fieldErrors.file ?? ""}
          onChooseFile={(f) => void onChooseFile(f)}
          onDeleteFile={() => {
            setDeleteLocalFile(true);
            setSelectedFileName(null);
            setSelectedFileMime(null);
            setSelectedFileBase64(null);
          }}
          onClose={() => setEditOpen(false)}
          onSubmit={() => void submitEditReport()}
        />
      ) : null}

      {toast ? <MessagePopup open message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

