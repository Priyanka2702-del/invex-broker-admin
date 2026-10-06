"use client";
/** Card with toolbar (search, dropdown filters, date range, amount range, CSV export) wrapped around DataTable. */
import { useMemo, useState } from "react";
import DataTable, { Column } from "./DataTable";
import SearchBar from "./SearchBar";
import FilterDropdown from "./FilterDropdown";
import DateFilter from "./DateFilter";
import ExportButton from "./ExportButton";

export type FilterDef<T> = { label: string; options: string[]; get: (row: T) => string };
type Props<T> = {
  rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; searchText: (row: T) => string; searchPlaceholder?: string;
  filters?: FilterDef<T>[]; dateGet?: (row: T) => string; dateLabel?: string; amountGet?: (row: T) => number;
  exportName: string; exportRow: (row: T) => Record<string, string | number>; onRowClick?: (row: T) => void;
  embedded?: boolean; pageSize?: number; initialSort?: { key: string; dir: "asc" | "desc" }; toolbarExtra?: React.ReactNode;
};
export default function EntityTable<T>(p: Props<T>) {
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<Record<string, string>>({});
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [min, setMin] = useState(""); const [max, setMax] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const f = from ? Date.parse(`${from}T00:00:00Z`) : -Infinity;
    const t = to ? Date.parse(`${to}T23:59:59Z`) : Infinity;
    return p.rows.filter((r) => {
      if (s && !p.searchText(r).toLowerCase().includes(s)) return false;
      for (const fl of p.filters ?? []) if (fv[fl.label] && fl.get(r) !== fv[fl.label]) return false;
      if (p.dateGet && (from || to)) { const d = Date.parse(p.dateGet(r)); if (d < f || d > t) return false; }
      if (p.amountGet) { const a = p.amountGet(r); if (min !== "" && a < Number(min)) return false; if (max !== "" && a > Number(max)) return false; }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.rows, q, fv, from, to, min, max]);
  const active = q || from || to || min || max || Object.values(fv).some(Boolean);
  const reset = () => { setQ(""); setFv({}); setFrom(""); setTo(""); setMin(""); setMax(""); };
  return (
    <div className={p.embedded ? "" : "ix-card"} style={{ overflow: "hidden" }}>
      <div className="ix-toolbar">
        <SearchBar value={q} onChange={setQ} placeholder={p.searchPlaceholder} />
        {(p.filters ?? []).map((fl) => <FilterDropdown key={fl.label} label={fl.label} value={fv[fl.label] ?? ""} options={fl.options} onChange={(v) => setFv((o) => ({ ...o, [fl.label]: v }))} />)}
        {p.dateGet && <DateFilter from={from} to={to} label={p.dateLabel} onChange={(a, b) => { setFrom(a); setTo(b); }} />}
        {p.amountGet && (
          <div className="ix-fl">Amount
            <input type="number" className="ix-input" style={{ width: 92 }} placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum amount" />–
            <input type="number" className="ix-input" style={{ width: 92 }} placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum amount" />
          </div>
        )}
        {active && <button type="button" className="ix-btn ix-btn-sm ix-btn-outline" onClick={reset}><i className="ti ti-x" />Clear</button>}
        <span className="ix-spacer" />
        {p.toolbarExtra}
        <ExportButton name={p.exportName} rows={filtered.map(p.exportRow)} />
      </div>
      <DataTable rows={filtered} columns={p.columns} rowKey={p.rowKey} pageSize={p.pageSize} onRowClick={p.onRowClick} initialSort={p.initialSort} />
    </div>
  );
}
