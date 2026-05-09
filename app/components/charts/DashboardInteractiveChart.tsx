"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import type { ChartInsight } from "@/lib/utils/chart-insights";
import { ReactEchart } from "./ReactEchart";
import styles from "./chart-detail-drawer.module.css";

type Props = {
  option: EChartsOption;
  height?: number;
  chartTitle: string;
  getInsights: (params: unknown) => ChartInsight;
  className?: string;
};

const LOAD_MS = 520;

export function DashboardInteractiveChart({ option, height = 280, chartTitle, getInsights, className }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<ChartInsight | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
    setLoading(false);
    setInsight(null);
  }, []);

  const onChartClick = useCallback(
    (params: unknown) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setOpen(true);
      setLoading(true);
      setInsight(null);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        try {
          setInsight(getInsights(params));
        } catch {
          setInsight({
            headline: "Không đọc được điểm dữ liệu",
            metrics: [],
            bullets: ["Thử nhấn trực tiếp vào cột / lát / điểm trên đường."]
          });
        }
        setLoading(false);
      }, LOAD_MS);
    },
    [getInsights]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <ReactEchart option={option} height={height} onChartClick={onChartClick} />
      <p className={styles.hint}>Nhấn vào biểu đồ để xem phân tích nhanh (theo dữ liệu hiện tại).</p>

      {open ? (
        <div className={styles.overlay} role="presentation" onClick={close}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chart-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.head}>
              <div>
                <p className={styles.kicker}>Chi tiết · {chartTitle}</p>
                <h3 id="chart-drawer-title" className={styles.title}>
                  {loading ? "Đang tải phân tích…" : insight?.headline ?? "—"}
                </h3>
              </div>
              <button type="button" className={styles.close} onClick={close} aria-label="Đóng">
                ×
              </button>
            </div>

            {loading ? (
              <div className={styles.skeleton} aria-hidden>
                <div className={styles.skLine} />
                <div className={styles.skLine} />
                <div className={`${styles.skLine} ${styles.skLineShort}`} />
              </div>
            ) : insight ? (
              <>
                <div className={styles.metrics}>
                  {insight.metrics.map((m) => (
                    <div key={m.label} className={styles.metric}>
                      <p className={styles.metricLabel}>{m.label}</p>
                      <p className={styles.metricValue}>{m.value}</p>
                      {m.sub ? <p className={styles.metricSub}>{m.sub}</p> : null}
                    </div>
                  ))}
                </div>
                {insight.bullets.length > 0 ? (
                  <ul className={styles.bullets}>
                    {insight.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
