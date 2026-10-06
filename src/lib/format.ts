export const DAY = 86_400_000;
export const HOUR = 3_600_000;
/** Fixed "now" so mock data is deterministic (30 Sep 2026, 13:00 UTC). Replace with Date.now() once APIs are wired. */
export const NOW = Date.UTC(2026, 8, 30, 13, 0, 0);
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const p2 = (n: number) => String(n).padStart(2, "0");
export const iso = (ms: number) => new Date(ms).toISOString();
export function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${p2(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
}
export function fmtDateTime(v?: string | null) {
  if (!v) return "—";
  return `${fmtDate(v)} ${fmtTime(v)}`;
}
const fixed = (n: number, d = 2) =>
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = (n: number, d = 2) => `${n < 0 ? "-" : ""}$${fixed(n, d)}`;
export const signedMoney = (n: number) => `${n >= 0 ? "+" : "-"}$${fixed(n)}`;
export const num = (n: number) => n.toLocaleString("en-US");
export function fmtDuration(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
}
export function downloadCsv(name: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [keys.map(esc).join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
