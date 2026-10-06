"use client";
import { useEffect, useRef, useState } from "react";

export type Series = { name: string; color: string; values: number[] };
const H = 230, PAD = { l: 46, r: 12, t: 12, b: 26 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
const niceMax = (v: number) => { const p = 10 ** Math.floor(Math.log10(v || 1)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const short = (n: number) => { const a = Math.abs(n); const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(1)}k` : `${a}`; return n < 0 ? `-${s}` : s; };

function Frame({ series, labels, fmt, kind }: { series: Series[]; labels: string[]; fmt: (n: number) => string; kind: "line" | "grouped" | "diverging" }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.values);
  const stackedMax = kind === "diverging" ? Math.max(...series.map((s) => Math.max(...s.values, 0))) : Math.max(...all, 1);
  const min = kind === "diverging" ? Math.min(...series.map((s) => Math.min(...s.values, 0))) : 0;
  const top = niceMax(stackedMax), bottom = min < 0 ? -niceMax(-min) : 0;
  const iw = w - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + ih - ((v - bottom) / (top - bottom || 1)) * ih;
  const n = labels.length, step = iw / n;
  const xc = (i: number) => PAD.l + (kind === "line" ? (iw * i) / (n - 1) : step * (i + 0.5));
  const ticks = Array.from({ length: 5 }, (_, i) => bottom + ((top - bottom) * i) / 4);
  const bw = kind === "grouped" ? Math.min(16, (step * 0.7) / series.length) : Math.min(20, step * 0.55);
  return (
    <div className="ix-chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={H} onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left;
        const i = kind === "line" ? Math.round(((x - PAD.l) / iw) * (n - 1)) : Math.floor((x - PAD.l) / step);
        setHover(i >= 0 && i < n ? i : null);
      }}>
        {ticks.map((t, i) => (
          <g key={i}><line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke={t === 0 && bottom < 0 ? "#cbd5e1" : "#eef2f8"} /><text x={PAD.l - 8} y={y(t) + 4} textAnchor="end">{short(t)}</text></g>
        ))}
        {labels.map((l, i) => (i % Math.ceil(n / 7) === 0 && (n - 1 - i) >= Math.ceil(n / 7) / 2 || i === n - 1) && <text key={l} x={xc(i)} y={H - 6} textAnchor="middle">{l}</text>)}
        {hover !== null && kind === "line" && <line x1={xc(hover)} x2={xc(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="#cfd9ea" strokeDasharray="4 4" />}
        {hover !== null && kind !== "line" && <rect x={PAD.l + step * hover} y={PAD.t} width={step} height={ih} fill="#2456e6" opacity={0.05} rx={6} />}
        {kind === "line" && series.map((s, si) => {
          const pts = s.values.map((v, i) => `${xc(i)},${y(v)}`);
          const gid = `g${si}${s.color.slice(1)}`;
          return (
            <g key={s.name}>
              <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity=".22" /><stop offset="100%" stopColor={s.color} stopOpacity="0" /></linearGradient></defs>
              <polygon points={`${xc(0)},${y(0)} ${pts.join(" ")} ${xc(n - 1)},${y(0)}`} fill={`url(#${gid})`} />
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
              {hover !== null && <circle cx={xc(hover)} cy={y(s.values[hover])} r={4.5} fill="#fff" stroke={s.color} strokeWidth={2.4} />}
            </g>
          );
        })}
        {kind !== "line" && series.map((s, si) => s.values.map((v, i) => {
          const x = kind === "grouped" ? xc(i) - (bw * series.length) / 2 + si * bw : xc(i) - bw / 2;
          const y0 = y(0), y1 = y(v);
          return <rect key={`${si}-${i}`} x={x} y={Math.min(y0, y1)} width={bw - 2} height={Math.max(1, Math.abs(y0 - y1))} rx={3} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.55} />;
        }))}
      </svg>
      {hover !== null && (
        <div className="ix-tip" style={{ left: Math.min(Math.max(xc(hover), 70), w - 70), top: 34 }}>
          <div style={{ opacity: .7, marginBottom: 3 }}>{labels[hover]}</div>
          {series.map((s) => <div key={s.name}><span style={{ color: s.color }}>●</span> {s.name}: <b>{fmt(s.values[hover])}</b></div>)}
        </div>
      )}
    </div>
  );
}
export function Legend({ series }: { series: Series[] }) {
  return <div className="ix-legend">{series.map((s) => <span key={s.name} style={{ ["--c" as string]: s.color }}>{s.name}</span>)}</div>;
}
export const LineChart = (p: { series: Series[]; labels: string[]; fmt?: (n: number) => string }) => <Frame {...p} fmt={p.fmt ?? String} kind="line" />;
export const BarChart = (p: { series: Series[]; labels: string[]; fmt?: (n: number) => string; diverging?: boolean }) => <Frame {...p} fmt={p.fmt ?? String} kind={p.diverging ? "diverging" : "grouped"} />;
