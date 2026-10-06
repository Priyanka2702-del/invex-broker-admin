"use client";
import { useMemo, useState } from "react";
import Pagination from "./Pagination";

export type Column<T> = {
  key: string; header: string; render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number; align?: "right";
};
type Props<T> = {
  rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; pageSize?: number;
  onRowClick?: (row: T) => void; initialSort?: { key: string; dir: "asc" | "desc" }; emptyText?: string;
};
export default function DataTable<T>({ rows, columns, rowKey, pageSize = 10, onRowClick, initialSort, emptyText = "No records match your filters" }: Props<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sortValue || !sort) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = sv(a), y = sv(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, columns, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pageCount);
  const slice = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  const toggle = (c: Column<T>) => {
    if (!c.sortValue) return;
    setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" }));
  };
  return (
    <>
      <div className="ix-tbl-wrap">
        <table className="ix-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`${c.sortValue ? "sortable" : ""} ${c.align === "right" ? "num" : ""}`} onClick={() => toggle(c)} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.header}
                  {c.sortValue && <i className={`ti ${sort?.key === c.key ? (sort.dir === "asc" ? "ti-arrow-up" : "ti-arrow-down") : "ti-arrows-sort"}`} style={{ opacity: sort?.key === c.key ? 1 : .45 }} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={rowKey(row)} className={onRowClick ? "click" : ""} onClick={() => onRowClick?.(row)}>
                {columns.map((c) => <td key={c.key} className={c.align === "right" ? "num" : ""}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {slice.length === 0 && <div className="ix-empty"><i className="ti ti-database-off" />{emptyText}</div>}
      </div>
      <Pagination page={cur} pageCount={pageCount} total={sorted.length} pageSize={pageSize} onPage={setPage} />
    </>
  );
}
