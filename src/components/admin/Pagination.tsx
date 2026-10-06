export default function Pagination({ page, pageCount, total, pageSize, onPage }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== "…") nums.push("…");
  return (
    <div className="ix-pager">
      <span>Showing {from}–{to} of {total}</span>
      <div className="pages">
        <button className="ix-pg" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><i className="ti ti-chevron-left" /></button>
        {nums.map((n, i) => n === "…" ? <span key={`e${i}`} className="ix-pg" style={{ border: 0 }}>…</span> :
          <button key={n} className={`ix-pg ${n === page ? "on" : ""}`} onClick={() => onPage(n)}>{n}</button>)}
        <button className="ix-pg" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page"><i className="ti ti-chevron-right" /></button>
      </div>
    </div>
  );
}
