"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
import { echarts } from "@/lib/echarts/register";

type Props = {
  option: EChartsOption;
  /** Chiều cao cố định (px); chiều ngang 100% */
  height?: number;
  className?: string;
  onChartClick?: (params: unknown) => void;
};

export function ReactEchart({ option, height = 280, className, onChartClick }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof echarts.init> | null>(null);
  const lastJson = useRef<string>("");
  const clickRef = useRef(onChartClick);
  clickRef.current = onChartClick;

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
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    const c = chart.current;
    if (!c || c.isDisposed?.()) return;
    const handler = (params: unknown) => clickRef.current?.(params);
    c.on("click", handler);
    return () => {
      c.off("click", handler);
    };
  }, []);

  useEffect(() => {
    const c = chart.current;
    if (!c || c.isDisposed?.()) return;
    const next = JSON.stringify(option);
    if (next === lastJson.current) return;
    lastJson.current = next;
    c.setOption(option, { notMerge: true, lazyUpdate: true });
  }, [option]);

  return <div ref={host} className={className} style={{ width: "100%", height }} />;
}
