import Link from "next/link";
import { getHttpErrorUiCopy } from "@/lib/constants/http-error-ui";
import styles from "./http-error-view.module.css";

export type HttpErrorViewProps = {
  /** Mã HTTP (404, 500, …). Mặc định 500 nếu không truyền. */
  status?: number;
  /** Ghi đè tiêu đề hiển thị */
  title?: string;
  /** Ghi đè gợi ý / mô tả cho người dùng */
  hint?: string;
  /** Thông báo lỗi từ server / Error.message — hiển thị trong khối kỹ thuật */
  technicalDetail?: string | null;
  /** Ẩn khối chi tiết kỹ thuật dù có `technicalDetail` */
  hideTechnical?: boolean;
  digest?: string;
  homeHref?: string;
  homeLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function HttpErrorView({
  status = 500,
  title: titleOverride,
  hint: hintOverride,
  technicalDetail,
  hideTechnical,
  digest,
  homeHref = "/",
  homeLabel = "Về trang chủ",
  onRetry,
  retryLabel = "Thử lại"
}: HttpErrorViewProps) {
  const safeStatus = Number.isFinite(status) && status >= 400 && status < 600 ? status : 500;
  const defaults = getHttpErrorUiCopy(safeStatus);
  const title = titleOverride ?? defaults.title;
  const hint = hintOverride ?? defaults.hint;
  const showTech = !hideTechnical && Boolean(technicalDetail?.trim());

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.code}>Lỗi {safeStatus}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.hint}>{hint}</p>

        {showTech ? (
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Chi tiết từ hệ thống</span>
            {technicalDetail!.trim()}
            {digest ? <div className={styles.digest}>Mã tham chiếu: {digest}</div> : null}
          </div>
        ) : digest ? (
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Mã tham chiếu</span>
            {digest}
          </div>
        ) : null}

        <div className={styles.actions}>
          {onRetry ? (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onRetry}>
              {retryLabel}
            </button>
          ) : null}
          <Link className={styles.btn} href={homeHref}>
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
