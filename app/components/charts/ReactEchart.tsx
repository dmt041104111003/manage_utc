"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import { echarts } from "@/lib/echarts/register";
import shellStyles from "./react-echart.module.css";

type Props = {
  option: EChartsOption;
  /** Chiều cao cố định (px); chiều ngang 100% */
  height?: number;
  className?: string;
  onChartClick?: (params: unknown) => void;
  /**
   * Click → overlay loading ngắn → setOption lại để chạy lại animation (không popup).
   * Dùng cho dashboard; tắt nếu không cần.
   */
  clickReloadPulse?: boolean;
};

const PULSE_MS = 520;

export function ReactEchart({
  option,
  height = 280,
  className,
  onChartClick,
  clickReloadPulse = false
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof echarts.init> | null>(null);
  const lastJson = useRef<string>("");
  const clickRef = useRef(onChartClick);
  clickRef.current = onChartClick;
  const pulseRef = useRef(clickReloadPulse);
  pulseRef.current = clickReloadPulse;
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pulse, setPulse] = useState(false);
  const [replayTick, setReplayTick] = useState(0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const c = echarts.init(el, undefined, { renderer: "canvas" });
    chart.current = c;
    const ro = new ResizeObserver(() => {
      c.resize();
    });
    ro.observe(el);
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  const applyOption = useCallback(() => {
    const c = chart.current;
    if (!c || c.isDisposed?.()) return;
    const next = JSON.stringify(option);
    if (replayTick === 0 && next === lastJson.current) return;
    lastJson.current = next;
    c.setOption(option, { notMerge: true, lazyUpdate: false });
  }, [option, replayTick]);

  useEffect(() => {
    applyOption();
  }, [applyOption]);

  useEffect(() => {
    const c = chart.current;
    if (!c || c.isDisposed?.()) return;
    const handler = (params: unknown) => {
      clickRef.current?.(params);
      if (!pulseRef.current) return;
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulse(true);
      pulseTimerRef.current = setTimeout(() => {
        pulseTimerRef.current = null;
        setReplayTick((t) => t + 1);
        setPulse(false);
      }, PULSE_MS);
    };
    c.on("click", handler);
    return () => {
      c.off("click", handler);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`${shellStyles.shell} ${className ?? ""}`}
      style={{ height }}
      data-echart-host=""
    >
      {pulse ? (
        <div className={shellStyles.overlay} aria-live="polite" aria-busy="true">
          <div className={shellStyles.spinner} />
          <p className={shellStyles.overlayText}>Đang cập nhật biểu đồ…</p>
        </div>
      ) : null}
      <div ref={host} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
