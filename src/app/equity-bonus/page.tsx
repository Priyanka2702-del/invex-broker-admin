"use client";
import { useMemo, useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { Modal } from "@/components/admin/ConfirmationModal";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { CURRENT_FAILURES, CURRENT_MONTH, equityHistory, evaluateMonth, type EquityMonth } from "@/data/equityBonus";
import { rng } from "@/data/random";
import { EQUITY_TIERS, l2Equity } from "@/lib/network";
import { fmtDate, money, num } from "@/lib/format";

const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const tone = (s: EquityMonth["status"]) => (s === "Qualified" ? "green" : s === "Warning" ? "amber" : s === "Forfeited" ? "red" : "slate");
const failLabel = (n: number) => (n === 1 ? "1st failure — Warning" : n === 2 ? "2nd failure — Warning" : "3rd failure — No bonus this month");

export default function EquityBonusPage() {
  const { users, ibs, ranks } = useAdminData();
  const [tab, setTab] = useState("current");
  const [detail, setDetail] = useState<string | null>(null);
  const current = useMemo(() => ibs.map((ib) => evaluateMonth(ib.userId, CURRENT_MONTH, l2Equity(users, ib.userId), CURRENT_FAILURES[ib.userId] ?? 0, rng(Number(ib.userId)), false)), [ibs, users]);
  const all = useMemo(() => [...current, ...equityHistory], [current]);
  const nm = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const sysRank = (id: string) => ranks.find((r) => r.id === users.find((u) => u.id === id)?.systemRankId)?.name ?? "—";
  const failures = all.flatMap((m) => m.failures.map((f, i) => ({ ...f, n: i + 1, m })));

  const userCols: Column<EquityMonth>[] = [
    { key: "u", header: "IB", render: (m) => <div><b>{nm(m.ibUserId)}</b><div style={{ fontSize: 12 }}><UserLink id={m.ibUserId} /></div></div>, sortValue: (m) => nm(m.ibUserId) },
    { key: "r", header: "System Rank (independent)", render: (m) => sysRank(m.ibUserId) },
    { key: "e", header: "Level 2 Equity", align: "right", render: (m) => <b>{money(m.maintainedEquity, 0)}</b>, sortValue: (m) => m.maintainedEquity },
    { key: "p", header: "Bonus %", align: "right", render: (m) => (m.pct ? `${m.pct}%` : "—"), sortValue: (m) => m.pct },
  ];
  const cols: Column<EquityMonth>[] = [
    ...userCols,
    { key: "b", header: "Bonus amount", align: "right", render: (m) => <b>{money(m.bonus, 0)}</b>, sortValue: (m) => m.bonus },
    { key: "f", header: "Failures", align: "right", render: (m) => m.failures.length, sortValue: (m) => m.failures.length },
    { key: "s", header: "Status", render: (m) => <StatusBadge status={m.status} tone={tone(m.status)} /> },
    { key: "a", header: "Actions", render: (m) => <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); setDetail(m.ibUserId); }}>Details</button> },
  ];
  const histCols: Column<EquityMonth>[] = [{ key: "mo", header: "Month", render: (m) => monthLabel(m.month), sortValue: (m) => m.month }, ...cols];
  const paid = equityHistory.reduce((s, m) => s + m.bonus, 0);
  const detailRows = detail ? all.filter((m) => m.ibUserId === detail).sort((a, b) => b.month.localeCompare(a.month)) : [];
  return (
    <>
      <PageHeader title="Equity Bonus" subtitle="Monthly bonus based only on Level 2 Team Current Equity, which must be maintained for the whole month. Independent of System Rank." />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Qualifying users" value={String(current.filter((m) => m.pct > 0).length)} icon="ti-user-check" tone="green" note={monthLabel(CURRENT_MONTH)} />
        <StatCard label="Current month bonus" value={money(current.reduce((s, m) => s + m.bonus, 0), 0)} icon="ti-calendar-dollar" note="Projected, not yet paid" />
        <StatCard label="Total bonus paid" value={money(paid, 0)} icon="ti-cash" tone="amber" note="Previous months" />
        <StatCard label="Level 2 team equity" value={money(current.reduce((s, m) => s + m.maintainedEquity, 0), 0)} icon="ti-chart-area" note={`${num(current.filter((m) => m.failures.length).length)} IBs with failures`} />
      </div>
      <div className="ix-grid c2" style={{ marginBottom: 18 }}>
        <Card title="Bonus tiers (Level 2 Team Current Equity)">
          {EQUITY_TIERS.map((t) => <div key={t.min} className="ix-row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eef2f8" }}><span>{t.max === Infinity ? `${money(t.min, 0)}+` : `${money(t.min, 0)} – ${money(t.max, 0)}`}</span><b>{t.pct}%</b></div>)}
        </Card>
        <Card title="Warning logic">
          <div className="ix-timeline">
            <div className="it"><span className="dot" style={{ background: "var(--ix-amber)", boxShadow: "none" }} /><div>First failure<small>Warning — bonus still paid</small></div></div>
            <div className="it"><span className="dot" style={{ background: "var(--ix-amber)", boxShadow: "none" }} /><div>Second failure<small>Warning — bonus still paid</small></div></div>
            <div className="it"><span className="dot" style={{ background: "var(--ix-red)", boxShadow: "none" }} /><div>Third failure<small>No Equity Bonus for that month</small></div></div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ix-muted)", marginTop: 14 }}>Example: an IB with the Ambassador system rank who maintains only $10,000 Level 2 equity receives 1%.</p>
        </Card>
      </div>
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={setTab} tabs={[{ id: "current", label: "Current month", count: current.length }, { id: "history", label: "Monthly history", count: equityHistory.length }, { id: "warnings", label: "Warning & failure history", count: failures.length }]} /></div>
      {tab === "current" && <EntityTable rows={current} rowKey={(m) => m.ibUserId} columns={cols} onRowClick={(m) => setDetail(m.ibUserId)} searchText={(m) => `${nm(m.ibUserId)} ${m.ibUserId}`} searchPlaceholder="Search IB…"
        filters={[{ label: "Status", options: ["Qualified", "Warning", "Forfeited", "Not qualified"], get: (m) => m.status }]} exportName="equity-bonus-current" exportRow={(m) => ({ IB: nm(m.ibUserId), "Level 2 Equity": m.maintainedEquity, Percent: m.pct, Bonus: m.bonus, Failures: m.failures.length, Status: m.status })} />}
      {tab === "history" && <EntityTable rows={equityHistory} rowKey={(m) => m.ibUserId + m.month} columns={histCols} onRowClick={(m) => setDetail(m.ibUserId)} searchText={(m) => `${nm(m.ibUserId)} ${m.ibUserId} ${m.month}`} searchPlaceholder="Search IB or month…"
        filters={[{ label: "Month", options: [...new Set(equityHistory.map((m) => m.month))].sort().reverse(), get: (m) => m.month }, { label: "Status", options: ["Qualified", "Warning", "Forfeited", "Not qualified"], get: (m) => m.status }]}
        exportName="equity-bonus-history" initialSort={{ key: "mo", dir: "desc" }} exportRow={(m) => ({ Month: m.month, IB: nm(m.ibUserId), "Maintained Equity": m.maintainedEquity, Percent: m.pct, Bonus: m.bonus, Failures: m.failures.length, Status: m.status })} />}
      {tab === "warnings" && <EntityTable rows={failures} rowKey={(f) => f.m.ibUserId + f.m.month + f.n} searchText={(f) => `${nm(f.m.ibUserId)} ${f.m.ibUserId}`} searchPlaceholder="Search IB…" dateGet={(f) => f.date} exportName="equity-failures"
        filters={[{ label: "Outcome", options: ["Warning", "No bonus"], get: (f) => (f.n >= 3 ? "No bonus" : "Warning") }]}
        columns={[
          { key: "d", header: "Date", render: (f) => fmtDate(f.date), sortValue: (f) => f.date },
          { key: "u", header: "IB", render: (f) => <div><b>{nm(f.m.ibUserId)}</b><div style={{ fontSize: 12 }}><UserLink id={f.m.ibUserId} /></div></div> },
          { key: "e", header: "Equity at failure", align: "right", render: (f) => money(f.equity, 0) },
          { key: "r", header: "Required", align: "right", render: (f) => money(f.required, 0) },
          { key: "n", header: "Failure", render: (f) => <StatusBadge status={failLabel(f.n)} tone={f.n >= 3 ? "red" : "amber"} /> },
          { key: "m", header: "Month", render: (f) => monthLabel(f.m.month) },
        ]} exportRow={(f) => ({ Date: fmtDate(f.date), IB: nm(f.m.ibUserId), Equity: f.equity, Required: f.required, Outcome: failLabel(f.n) })} />}
      {detail && (
        <Modal wide title={`Equity bonus — ${nm(detail)}`} onClose={() => setDetail(null)}>
          <div style={{ marginBottom: 10 }}>User <UserLink id={detail} /> · System Rank: <b>{sysRank(detail)}</b> (independent of bonus tier)</div>
          <div className="ix-tbl-wrap"><table className="ix-table"><thead><tr><th>Month</th><th className="num">Equity</th><th className="num">%</th><th className="num">Bonus</th><th>Failures</th><th>Status</th></tr></thead>
            <tbody>{detailRows.map((m) => <tr key={m.month}><td>{monthLabel(m.month)}</td><td className="num">{money(m.maintainedEquity, 0)}</td><td className="num">{m.pct}%</td><td className="num">{money(m.bonus, 0)}</td>
              <td>{m.failures.length ? m.failures.map((f, i) => <div key={i} style={{ fontSize: 12 }}>{fmtDate(f.date)} · {money(f.equity, 0)} &lt; {money(f.required, 0)}</div>) : "—"}</td><td><StatusBadge status={m.status} tone={tone(m.status)} /></td></tr>)}</tbody></table></div>
        </Modal>
      )}
    </>
  );
}
