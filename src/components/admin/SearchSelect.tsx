"use client";
import { useMemo, useState } from "react";

export type SearchOption = { value: string; label: string; sub?: string };

/** Searchable single-select list: search box on top, scrollable options below. */
export default function SearchSelect({ options, value, onChange, placeholder = "Search…", noneLabel }: {
  options: SearchOption[]; value: string; onChange: (v: string) => void; placeholder?: string; noneLabel?: string;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => `${o.label} ${o.value} ${o.sub ?? ""}`.toLowerCase().includes(s)) : options;
  }, [options, q]);
  const showNone = !!noneLabel && !q.trim();
  const row = (selected: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left",
    padding: "10px 14px", border: 0, borderBottom: "1px solid #eef2f8", cursor: "pointer", fontSize: 13.5,
    background: selected ? "var(--ix-primary-soft)" : "#fff", color: selected ? "var(--ix-primary)" : "var(--ix-text)", fontWeight: selected ? 600 : 400,
  });
  return (
    <div style={{ border: "1px solid var(--ix-border-strong)", borderRadius: 12, overflow: "hidden" }}>
      <div className="ix-search" style={{ maxWidth: "none", borderBottom: "1px solid var(--ix-border)", padding: 8 }}>
        <i className="ti ti-search" style={{ left: 20, top: 18 }} />
        <input className="ix-input" style={{ width: "100%", paddingLeft: 34 }} value={q} placeholder={placeholder} aria-label="Search" autoFocus onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto" }} role="listbox">
        {showNone && <button type="button" role="option" aria-selected={value === ""} style={row(value === "")} onClick={() => onChange("")}><span>{noneLabel}</span>{value === "" && <i className="ti ti-check" />}</button>}
        {list.map((o) => (
          <button key={o.value} type="button" role="option" aria-selected={value === o.value} style={row(value === o.value)} onClick={() => onChange(o.value)}>
            <span><b style={{ fontWeight: 600 }}>{o.label}</b>{o.sub && <span style={{ display: "block", fontSize: 12, color: "var(--ix-muted)", fontWeight: 400 }}>{o.sub}</span>}</span>
            {value === o.value && <i className="ti ti-check" />}
          </button>
        ))}
        {list.length === 0 && <div className="ix-empty" style={{ padding: 24 }}>No results for “{q}”</div>}
      </div>
    </div>
  );
}