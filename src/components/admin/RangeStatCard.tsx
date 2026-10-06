"use client";
import { useState } from "react";
import { HOUR, NOW } from "@/lib/format";

export type Range = { from: number; to: number; label: string };
export const PRESETS: { id: string; label: string; make: () => Range }[] = [
  { id: "24h", label: "Last 24 hours", make: () => ({ from: NOW - 24 * HOUR, to: NOW, label: "Last 24 hours" }) },
  { id: "7d", label: "Last 7 days", make: () => ({ from: NOW - 7 * 24 * HOUR, to: NOW, label: "Last 7 days" }) },
  { id: "30d", label: "Last 30 days", make: () => ({ from: NOW - 30 * 24 * HOUR, to: NOW, label: "Last 30 days" }) },
  { id: "all", label: "All time", make: () => ({ from: 0, to: NOW, label: "All time" }) },
];
const toLocal = (ms: number) => new Date(ms).toISOString().slice(0, 16);

/** Stat card with its own date/time range popover. `compute(range)` returns the formatted value. */
export default function RangeStatCard({ label, icon, tone = "blue", initial = "all", compute, note }: {
  label: string; icon: string; tone?: "blue" | "green" | "amber" | "red"; initial?: string; compute: (r: Range) => string; note?: string;
}) {
  const [range, setRange] = useState<Range>(PRESETS.find((p) => p.id === initial)!.make());
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(toLocal(range.from || NOW - 30 * 24 * HOUR)); const [t, setT] = useState(toLocal(range.to));
  return (
    <div className="ix-card ix-stat" style={{ position: "relative", overflow: "visible" }}>
      <div className={`ic ${tone === "blue" ? "" : tone}`}><i className={`ti ${icon}`} /></div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="l">{label}</div>
        <div className="v">{compute(range)}</div>
        <button type="button" className="ix-btn ix-btn-sm ix-btn-soft" style={{ height: 26, padding: "0 9px", fontSize: 11.5 }} onClick={() => setOpen((o) => !o)}>
          <i className="ti ti-calendar-time" style={{ fontSize: 14 }} />{range.label}
        </button>
        {note && <span className="d nt" style={{ display: "block", marginTop: 4 }}>{note}</span>}
      </div>
      {open && (
        <div className="ix-pop" style={{ right: 12, top: "calc(100% - 8px)", minWidth: 280, padding: 14 }}>
          <div className="ix-row" style={{ gap: 6, marginBottom: 10 }}>
            {PRESETS.map((p) => <button key={p.id} className="ix-btn ix-btn-sm ix-btn-outline" onClick={() => { setRange(p.make()); setOpen(false); }}>{p.label}</button>)}
          </div>
          <div className="ix-field" style={{ marginTop: 0 }}><label>From (date &amp; time, UTC)</label><input type="datetime-local" className="ix-input" value={f} onChange={(e) => setF(e.target.value)} /></div>
          <div className="ix-field"><label>To</label><input type="datetime-local" className="ix-input" value={t} onChange={(e) => setT(e.target.value)} /></div>
          <button className="ix-btn ix-btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={() => { const a = Date.parse(`${f}:00Z`), b = Date.parse(`${t}:00Z`); if (!isNaN(a) && !isNaN(b) && a <= b) { setRange({ from: a, to: b, label: "Custom range" }); setOpen(false); } }}>Apply range</button>
        </div>
      )}
    </div>
  );
}
