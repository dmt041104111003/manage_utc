"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
import { echarts } from "@/lib/echarts/register";

type Props = {
  option: EChartsOption;
  /** Chiều cao cố định (px); chiều ngang 100% */
  height?: number;
  className?: string;
};

export function ReactEchart({ option, height = 280, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof echarts.init> | null>(null);
  const lastJson = useRef<string>("");

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
    if (!c) return;
    const next = JSON.stringify(option);
    if (next === lastJson.current) return;
    lastJson.current = next;
    c.setOption(option, { notMerge: true, lazyUpdate: true });
  }, [option]);

  return <div ref={host} className={className} style={{ width: "100%", height }} />;
}
