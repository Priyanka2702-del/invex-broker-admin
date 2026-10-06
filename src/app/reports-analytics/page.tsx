"use client";
import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import ExportButton from "@/components/admin/ExportButton";
import DateFilter from "@/components/admin/DateFilter";
import FilterDropdown from "@/components/admin/FilterDropdown";
import SearchBar from "@/components/admin/SearchBar";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { BarChart, Legend, LineChart } from "@/components/admin/Charts";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { ibStats } from "@/lib/selectors";
import { rebateLedger, revenueLedger } from "@/lib/network";
import { DAY, NOW, fmtDate, fmtDateTime, money, num, signedMoney } from "@/lib/format";

type Kind = "Deposit" | "Withdrawal" | "Trade" | "Commission" | "Revenue";
interface Row { id: string; kind: Kind; at: string; userId: string; ib: string; type: string; status: string; amount: number; volume: number; desc: string }
const BLUE = "#2456e6", AMBER = "#e59a1b", GREEN = "#0f9d58", RED = "#d92d3a";
const dayKey = (iso: string) => iso.slice(0, 10);

export default function ReportsAnalyticsPage() {
  const d = useAdminData();
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [user, setUser] = useState(""); const [ib, setIb] = useState(""); const [type, setType] = useState(""); const [status, setStatus] = useState("");
  const uname = (id: string) => d.users.find((u) => u.id === id)?.name ?? id;
  const ibOf = (id: string) => d.users.find((u) => u.id === id)?.ibId ?? "Direct";

  const all = useMemo<Row[]>(() => {
    const r: Row[] = [];
    d.deposits.forEach((x) => r.push({ id: x.id, kind: "Deposit", at: x.createdAt, userId: x.userId, ib: ibOf(x.userId), type: x.method, status: x.status, amount: x.amount, volume: 0, desc: `Deposit via ${x.method}` }));
    d.withdrawals.forEach((x) => r.push({ id: x.id, kind: "Withdrawal", at: x.createdAt, userId: x.userId, ib: ibOf(x.userId), type: x.method, status: x.status, amount: x.amount, volume: 0, desc: `Withdrawal via ${x.method}` }));
    d.trades.forEach((t) => { r.push({ id: t.id, kind: "Trade", at: t.openTime, userId: t.userId, ib: ibOf(t.userId), type: t.side, status: t.status, amount: t.profit, volume: t.volume, desc: `${t.side} ${t.volume.toFixed(2)} ${t.symbol}` });
      r.push({ id: `${t.id}-FEE`, kind: "Revenue", at: t.openTime, userId: t.userId, ib: ibOf(t.userId), type: "Trade commission", status: t.status === "Closed" ? "Settled" : "Pending", amount: t.commission, volume: 0, desc: `Commission on ${t.id}` }); });
    rebateLedger(d.users, d.trades).forEach((x) => r.push({ id: x.id, kind: "Commission", at: x.at, userId: x.traderId, ib: d.ibs.find((i) => i.userId === x.ibUserId)?.id ?? "—", type: "Rebate", status: x.status, amount: x.rebate, volume: x.volume, desc: `Level ${x.level} rebate to ${x.ibName}` }));
    revenueLedger(d.users, d.ibs, d.trades, NOW).forEach((x) => r.push({ id: x.id, kind: "Commission", at: x.at, userId: x.traderId, ib: d.ibs.find((i) => i.userId === x.uplineId)?.id ?? "—", type: "Revenue Link", status: x.status, amount: x.commission, volume: 0, desc: `Level ${x.level} ${x.accountPlus ? "Account Plus" : "Account Minus"} · ${x.uplineName}` }));
    return r.sort((a, b) => b.at.localeCompare(a.at));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.deposits, d.withdrawals, d.trades, d.users, d.ibs]);

  const kindForTab: Record<string, Kind | undefined> = { deposits: "Deposit", withdrawals: "Withdrawal", trades: "Trade", commissions: "Commission", revenue: "Revenue" };
  const scope = useMemo(() => all.filter((r) => !kindForTab[tab] || r.kind === kindForTab[tab]), [all, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => {
    const f = from ? Date.parse(`${from}T00:00:00Z`) : -Infinity, t = to ? Date.parse(`${to}T23:59:59Z`) : Infinity, s = q.trim().toLowerCase();
    return scope.filter((r) => { const at = Date.parse(r.at); return at >= f && at <= t && (!user || r.userId === user.split(" ")[0]) && (!ib || r.ib === ib) && (!type || r.type === type) && (!status || r.status === status) && (!s || `${r.id} ${r.userId} ${uname(r.userId)} ${r.desc}`.toLowerCase().includes(s)); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, q, from, to, user, ib, type, status]);

  const sum = (k: Kind, f?: (r: Row) => boolean) => rows.filter((r) => r.kind === k && (!f || f(r))).reduce((s, r) => s + r.amount, 0);
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(NOW - (13 - i) * DAY).toISOString()));
  const labels = days.map((x) => `${Number(x.slice(8))} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(x.slice(5, 7)) - 1]}`);
  const series = (k: Kind, f?: (r: Row) => number) => days.map((day) => rows.filter((r) => r.kind === k && dayKey(r.at) === day).reduce((s, r) => s + (f ? f(r) : r.amount), 0));
  const ibRows = useMemo(() => d.ibs.map((i) => ({ i, name: uname(i.userId), ...ibStats(i, d) })), [d]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols: Column<Row>[] = [
    { key: "id", header: "Reference", render: (r) => <span className="ix-mono">{r.id}</span> },
    { key: "k", header: "Report", render: (r) => <span className="ix-badge blue">{r.kind}</span> },
    { key: "u", header: "User", render: (r) => <div><b>{uname(r.userId)}</b> <UserLink id={r.userId} /></div> },
    { key: "i", header: "IB", render: (r) => r.ib },
    { key: "t", header: "Type", render: (r) => r.type },
    { key: "d", header: "Description", render: (r) => r.desc },
    { key: "a", header: "Amount", align: "right", render: (r) => <b className={r.kind === "Trade" ? (r.amount >= 0 ? "pos" : "neg") : ""}>{r.kind === "Trade" ? signedMoney(r.amount) : money(r.amount)}</b>, sortValue: (r) => r.amount },
    { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} tone={["Settled", "Distributed"].includes(r.status) ? "green" : r.status === "On Hold" ? "red" : undefined} /> },
    { key: "dt", header: "Date/Time", render: (r) => fmtDateTime(r.at), sortValue: (r) => r.at },
  ];
  const ibCols: Column<(typeof ibRows)[number]>[] = [
    { key: "n", header: "IB", render: (r) => <div><b>{r.name}</b><div className="ix-mono" style={{ color: "var(--ix-muted)" }}>{r.i.id}</div></div>, sortValue: (r) => r.name },
    { key: "k", header: "Rank", render: (r) => <span className="ix-badge blue">{r.i.rank}</span> },
    { key: "t", header: "Type", render: (r) => r.i.type },
    { key: "r", header: "Referred", align: "right", render: (r) => r.referredCount, sortValue: (r) => r.referredCount },
    { key: "v", header: "Volume", align: "right", render: (r) => `${r.volume.toFixed(2)} lots`, sortValue: (r) => r.volume },
    { key: "rv", header: "Revenue", align: "right", render: (r) => money(r.revenue), sortValue: (r) => r.revenue },
    { key: "c", header: "Commission", align: "right", render: (r) => money(r.commission), sortValue: (r) => r.commission },
  ];
  const isIb = tab === "ib";
  const typeOpts = [...new Set(scope.map((r) => r.type))]; const statusOpts = [...new Set(scope.map((r) => r.status))];
  const users = d.users.map((u) => `${u.id} · ${u.name}`);
  const tabs = [["overview", "Overview"], ["deposits", "Deposits"], ["withdrawals", "Withdrawals"], ["trades", "Trades"], ["commissions", "Commissions"], ["ib", "IB Performance"], ["revenue", "Revenue"]].map(([id, label]) => ({ id, label }));
  const flow = [{ name: "Deposits", color: BLUE, values: series("Deposit") }, { name: "Withdrawals", color: AMBER, values: series("Withdrawal") }];
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Deposits, withdrawals, trades, commissions, IB performance and revenue — filter once, analyse everywhere." />
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={(t) => { setTab(t); setType(""); setStatus(""); }} tabs={tabs} /></div>
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-toolbar" style={{ borderBottom: 0 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search reference, user, description…" />
          <DateFilter from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); }} />
          <FilterDropdown label="User" value={user} options={users} onChange={setUser} />
          <FilterDropdown label="IB" value={ib} options={["Direct", ...d.ibs.map((i) => i.id)]} onChange={setIb} />
          {!isIb && <FilterDropdown label="Type" value={type} options={typeOpts} onChange={setType} />}
          {!isIb && <FilterDropdown label="Status" value={status} options={statusOpts} onChange={setStatus} />}
          {(q || from || to || user || ib || type || status) && <button className="ix-btn ix-btn-sm ix-btn-outline" onClick={() => { setQ(""); setFrom(""); setTo(""); setUser(""); setIb(""); setType(""); setStatus(""); }}><i className="ti ti-x" />Clear</button>}
        </div>
      </div>

      {tab === "overview" && <>
        <div className="ix-grid stats" style={{ marginBottom: 18 }}>
          <StatCard label="Deposits" value={money(sum("Deposit", (r) => r.status === "Successful"), 0)} icon="ti-arrow-bar-to-down" tone="green" note="Successful" />
          <StatCard label="Withdrawals" value={money(sum("Withdrawal", (r) => r.status === "Successful"), 0)} icon="ti-arrow-bar-to-up" tone="amber" note="Successful" />
          <StatCard label="Trading volume" value={`${rows.filter((r) => r.kind === "Trade").reduce((s, r) => s + r.volume, 0).toFixed(2)} lots`} icon="ti-chart-candle" note={`${rows.filter((r) => r.kind === "Trade").length} trades`} />
          <StatCard label="Commissions paid" value={money(sum("Commission"), 0)} icon="ti-percentage" />
          <StatCard label="Company revenue" value={money(sum("Revenue"), 0)} icon="ti-coin" tone="green" />
        </div>
        <div className="ix-grid c2">
          <Card title="Deposits vs withdrawals" action={<Legend series={flow} />}><BarChart series={flow} labels={labels} fmt={(n) => money(n, 0)} /></Card>
          <Card title="Trading volume" subtitle="Lots opened per day"><LineChart series={[{ name: "Lots", color: BLUE, values: series("Trade", (r) => r.volume) }]} labels={labels} fmt={(n) => `${n.toFixed(2)} lots`} /></Card>
          <Card title="Commissions" subtitle="Rebate + revenue-link commission per day"><LineChart series={[{ name: "Commission", color: AMBER, values: series("Commission") }]} labels={labels} fmt={(n) => money(n)} /></Card>
          <Card title="Client profit / loss" subtitle="Net trade result per day" action={<Legend series={[{ name: "Profit", color: GREEN, values: [] }, { name: "Loss", color: RED, values: [] }]} />}>
            <BarChart diverging series={[{ name: "Profit", color: GREEN, values: days.map((day) => rows.filter((r) => r.kind === "Trade" && dayKey(r.at) === day && r.amount > 0).reduce((s, r) => s + r.amount, 0)) }, { name: "Loss", color: RED, values: days.map((day) => rows.filter((r) => r.kind === "Trade" && dayKey(r.at) === day && r.amount < 0).reduce((s, r) => s + r.amount, 0)) }]} labels={labels} fmt={signedMoney} />
          </Card>
        </div>
      </>}

      {!isIb && tab !== "overview" && <>
        <div className="ix-grid c4" style={{ marginBottom: 18 }}>
          <StatCard label="Records" value={num(rows.length)} icon="ti-list-details" />
          <StatCard label={tab === "trades" ? "Net P/L" : "Total amount"} value={tab === "trades" ? signedMoney(rows.reduce((s, r) => s + r.amount, 0)) : money(rows.reduce((s, r) => s + r.amount, 0))} icon="ti-sum" tone="green" />
          <StatCard label="Average" value={money(rows.length ? rows.reduce((s, r) => s + r.amount, 0) / rows.length : 0)} icon="ti-chart-line" />
          <StatCard label="Period" value={rows.length ? `${fmtDate(rows[rows.length - 1].at)}` : "—"} icon="ti-calendar" note={rows.length ? `to ${fmtDate(rows[0].at)}` : undefined} />
        </div>
        <Card title="Daily trend"><LineChart series={[{ name: "Amount", color: BLUE, values: days.map((day) => rows.filter((r) => dayKey(r.at) === day).reduce((s, r) => s + r.amount, 0)) }]} labels={labels} fmt={(n) => money(n)} /></Card>
      </>}
      {isIb && (
        <Card title="Revenue by IB" subtitle="Referred-client revenue vs commission paid"><BarChart series={[{ name: "Revenue", color: BLUE, values: ibRows.map((r) => Math.round(r.revenue)) }, { name: "Commission", color: AMBER, values: ibRows.map((r) => Math.round(r.commission)) }]} labels={ibRows.map((r) => r.i.id.slice(3))} fmt={(n) => money(n, 0)} /></Card>
      )}

      <div className="ix-card" style={{ marginTop: 18, overflow: "hidden" }}>
        <div className="ix-card-h" style={{ paddingBottom: 12 }}><div><h3>{isIb ? "IB performance" : "Detailed records"}</h3><p>{isIb ? `${ibRows.length} IBs` : `${rows.length} records`}</p></div>
          <ExportButton name={`report-${tab}`} rows={isIb ? ibRows.map((r) => ({ IB: r.i.id, Name: r.name, Rank: r.i.rank, Referred: r.referredCount, Volume: r.volume, Revenue: r.revenue.toFixed(2), Commission: r.commission.toFixed(2) })) : rows.map((r) => ({ Reference: r.id, Report: r.kind, "User ID": r.userId, IB: r.ib, Type: r.type, Status: r.status, Amount: r.amount, "Date/Time": fmtDateTime(r.at) }))} /></div>
        {isIb ? <DataTable rows={ibRows.filter((r) => (!ib || r.i.id === ib) && (!q || `${r.name} ${r.i.id}`.toLowerCase().includes(q.toLowerCase())))} columns={ibCols} rowKey={(r) => r.i.id} initialSort={{ key: "rv", dir: "desc" }} />
          : <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} initialSort={{ key: "dt", dir: "desc" }} />}
      </div>
    </>
  );
}
