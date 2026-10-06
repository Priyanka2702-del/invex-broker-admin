"use client";
import { useMemo, useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import RangeStatCard from "@/components/admin/RangeStatCard";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { IB_LEVELS, REVENUE_DEFAULT, levelUsers, revenueLedger, uplineChain } from "@/lib/network";
import { NOW, fmtDate, fmtTime, money, signedMoney } from "@/lib/format";
import type { IBRank } from "@/types/admin";

type Row = ReturnType<typeof revenueLedger>[number];
export default function RevenueLinkCommissionPage() {
  const { users, ibs, trades } = useAdminData();
  const [tab, setTab] = useState("ledger");
  const rows = useMemo(() => revenueLedger(users, ibs, trades, NOW), [users, ibs, trades]);
  const rlUsers = users.filter((u) => u.registrationType === "Revenue Link");
  const inR = (at: string, r: { from: number; to: number }) => { const t = Date.parse(at); return t >= r.from && t <= r.to; };
  const sum = (f: (r: Row) => number, rg?: { from: number; to: number }) => rows.filter((r) => !rg || inR(r.at, rg)).reduce((s, r) => s + f(r), 0);
  const active = rlUsers.filter((u) => u.accountStatus !== "Banned" && (u.balance > 0 || trades.some((t) => t.userId === u.id))).length;

  const ledgerCols: Column<Row>[] = [
    { key: "u", header: "Revenue Link User", render: (r) => <div><b>{r.traderName}</b><div className="sub" style={{ fontSize: 12 }}><UserLink id={r.traderId} /></div></div>, sortValue: (r) => r.traderName },
    { key: "up", header: "Upline", render: (r) => <div><b>{r.uplineName}</b><div style={{ fontSize: 12, color: "var(--ix-muted)" }}><UserLink id={r.uplineId} /> · {r.uplineRank}</div></div> },
    { key: "l", header: "Level", render: (r) => <span className="ix-badge blue">Level {r.level}</span>, sortValue: (r) => r.level },
    { key: "r", header: "Rate", align: "right", render: (r) => `${r.rate}%` },
    { key: "pl", header: "Profit/Loss", align: "right", render: (r) => <span className={r.pl >= 0 ? "pos" : "neg"}>{signedMoney(r.pl)}</span>, sortValue: (r) => r.pl },
    { key: "c", header: "Commission", align: "right", render: (r) => <b>{money(r.commission)}</b>, sortValue: (r) => r.commission },
    { key: "p", header: "Account Plus", align: "right", render: (r) => r.accountPlus ? <span className="pos">+{money(r.accountPlus)}</span> : "—", sortValue: (r) => r.accountPlus },
    { key: "m", header: "Account Minus", align: "right", render: (r) => r.accountMinus ? <span className="neg">−{money(r.accountMinus)}</span> : "—", sortValue: (r) => r.accountMinus },
    { key: "d", header: "Date", render: (r) => `${fmtDate(r.at)} ${fmtTime(r.at)}`, sortValue: (r) => r.at },
    { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} tone={r.status === "Settled" ? "green" : r.status === "Pending" ? "amber" : "red"} /> },
  ];
  const userRows = rlUsers.map((u) => {
    const mine = rows.filter((r) => r.traderId === u.id && r.level === 1);
    const t = trades.filter((x) => x.userId === u.id && x.status === "Closed");
    return { u, upline: uplineChain(users, u.id)[0], plus: mine.reduce((s, r) => s + r.accountPlus, 0), minus: mine.reduce((s, r) => s + r.accountMinus, 0), pl: t.reduce((s, x) => s + x.profit, 0), trades: t.length };
  });
  const uplineRows = ibs.map((ib) => {
    const owner = users.find((u) => u.id === ib.userId)!;
    const mine = rows.filter((r) => r.uplineId === ib.userId);
    return { ib, owner, counts: [1, 2, 3, 4, 5].map((l) => levelUsers(users, ib.userId, l).filter((u) => u.registrationType === "Revenue Link").length), plus: mine.reduce((s, r) => s + r.accountPlus, 0), minus: mine.reduce((s, r) => s + r.accountMinus, 0) };
  });
  return (
    <>
      <PageHeader title="Revenue Link Commission" subtitle="Commission on client liquidation / loss, up to 5 levels. Losses credit the upline (Account Plus); profits are deducted from the upline (Account Minus) and paid to the client." />
      <div className="ix-grid stats" style={{ marginBottom: 18 }}>
        <RangeStatCard label="Total Revenue Link Commission" icon="ti-coin" compute={(r) => money(sum((x) => x.commission, r))} />
        <RangeStatCard label="Account Plus" icon="ti-circle-plus" tone="green" compute={(r) => money(sum((x) => x.accountPlus, r))} note="Received on client losses" />
        <RangeStatCard label="Account Minus" icon="ti-circle-minus" tone="red" compute={(r) => money(sum((x) => x.accountMinus, r))} note="Deducted on client profits" />
        <StatCard label="Active Revenue Link Users" value={String(active)} icon="ti-users" tone="amber" note={`of ${rlUsers.length} revenue-link clients`} />
        <RangeStatCard label="Last 24 Hour Commission" icon="ti-clock-up" initial="24h" compute={(r) => money(sum((x) => x.commission, r))} />
      </div>
      <div className="ix-grid c2" style={{ marginBottom: 18 }}>
        <Card title="Commission levels">
          <div className="ix-stack" style={{ gap: 0 }}>
            {REVENUE_DEFAULT.map((v, i) => <div key={i} className="ix-row" style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eef2f8" }}><span>Level {i + 1}</span><b>{v}%</b></div>)}
          </div>
        </Card>
        <Card title="Rank-wise level unlocking">
          <div className="ix-stack" style={{ gap: 0 }}>
            {(Object.entries(IB_LEVELS) as [IBRank, number][]).map(([r, l]) => <div key={r} className="ix-row" style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eef2f8" }}><span>{r} IB</span><b>{l === 1 ? "Level 1" : `Up to Level ${l}`}</b></div>)}
          </div>
        </Card>
      </div>
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={setTab} tabs={[{ id: "ledger", label: "Commission ledger", count: rows.length }, { id: "users", label: "Revenue Link users", count: rlUsers.length }, { id: "network", label: "Upline / Downline", count: ibs.length }]} /></div>
      {tab === "ledger" && <EntityTable rows={rows} rowKey={(r) => r.id} columns={ledgerCols} searchText={(r) => `${r.traderName} ${r.traderId} ${r.uplineName} ${r.uplineId} ${r.tradeId}`} searchPlaceholder="Search user, upline or trade…"
        filters={[{ label: "Level", options: ["1", "2", "3", "4", "5"], get: (r) => String(r.level) }, { label: "Status", options: ["Settled", "Pending", "On Hold"], get: (r) => r.status }, { label: "Type", options: ["Account Plus", "Account Minus"], get: (r) => (r.accountPlus ? "Account Plus" : "Account Minus") }]}
        dateGet={(r) => r.at} exportName="revenue-link-commission" initialSort={{ key: "d", dir: "desc" }}
        exportRow={(r) => ({ User: r.traderName, "User ID": r.traderId, Upline: r.uplineName, Level: r.level, Rate: `${r.rate}%`, "P/L": r.pl, Commission: r.commission, "Account Plus": r.accountPlus, "Account Minus": r.accountMinus, Date: fmtDate(r.at), Status: r.status })} />}
      {tab === "users" && <EntityTable rows={userRows} rowKey={(r) => r.u.id} searchText={(r) => `${r.u.name} ${r.u.id}`} exportName="revenue-link-users" searchPlaceholder="Search revenue link users…"
        columns={[
          { key: "u", header: "Revenue Link User", render: (r) => <div><b>{r.u.name}</b><div style={{ fontSize: 12 }}><UserLink id={r.u.id} /></div></div>, sortValue: (r) => r.u.name },
          { key: "up", header: "Upline", render: (r) => (r.upline ? <UserLink id={r.upline.id} name={`${r.upline.name} (${r.upline.id})`} /> : "—") },
          { key: "t", header: "Closed trades", align: "right", render: (r) => r.trades, sortValue: (r) => r.trades },
          { key: "pl", header: "Profit/Loss", align: "right", render: (r) => <span className={r.pl >= 0 ? "pos" : "neg"}>{signedMoney(r.pl)}</span>, sortValue: (r) => r.pl },
          { key: "p", header: "Account Plus (L1)", align: "right", render: (r) => money(r.plus), sortValue: (r) => r.plus },
          { key: "m", header: "Account Minus (L1)", align: "right", render: (r) => money(r.minus), sortValue: (r) => r.minus },
          { key: "s", header: "Status", render: (r) => <StatusBadge status={r.u.accountStatus} /> },
        ]} exportRow={(r) => ({ User: r.u.name, "User ID": r.u.id, "P/L": r.pl, "Account Plus": r.plus, "Account Minus": r.minus })} />}
      {tab === "network" && <EntityTable rows={uplineRows} rowKey={(r) => r.ib.id} searchText={(r) => `${r.owner.name} ${r.ib.userId} ${r.ib.id}`} exportName="revenue-network" searchPlaceholder="Search uplines…"
        columns={[
          { key: "u", header: "Upline", render: (r) => <div><b>{r.owner.name}</b><div style={{ fontSize: 12 }}><UserLink id={r.owner.id} /></div></div>, sortValue: (r) => r.owner.name },
          { key: "k", header: "IB Rank", render: (r) => <span className="ix-badge blue">{r.ib.rank}</span> },
          { key: "lv", header: "Unlocked", render: (r) => `Up to Level ${IB_LEVELS[r.ib.rank]}` },
          ...[1, 2, 3, 4, 5].map((l) => ({ key: `l${l}`, header: `L${l} downline`, align: "right" as const, render: (r: (typeof uplineRows)[number]) => <span style={{ opacity: l > IB_LEVELS[r.ib.rank] ? 0.35 : 1 }}>{r.counts[l - 1]}</span> })),
          { key: "p", header: "Account Plus", align: "right", render: (r) => <span className="pos">{money(r.plus)}</span>, sortValue: (r) => r.plus },
          { key: "m", header: "Account Minus", align: "right", render: (r) => <span className="neg">{money(r.minus)}</span>, sortValue: (r) => r.minus },
        ]} exportRow={(r) => ({ Upline: r.owner.name, Rank: r.ib.rank, "Account Plus": r.plus, "Account Minus": r.minus })} />}
    </>
  );
}
