"use client";
import { useMemo } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import RangeStatCard from "@/components/admin/RangeStatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { rebateLedger, revenueLedger, REBATE_DEFAULT } from "@/lib/network";
import { NOW, fmtDate, fmtTime, money } from "@/lib/format";

type Row = ReturnType<typeof rebateLedger>[number];
export default function RebateSystemPage() {
  const { users, trades, ibs } = useAdminData();
  const rows = useMemo(() => rebateLedger(users, trades), [users, trades]);
  const revenue = useMemo(() => revenueLedger(users, ibs, trades, NOW), [users, ibs, trades]);
  const inR = (at: string, r: { from: number; to: number }) => { const t = Date.parse(at); return t >= r.from && t <= r.to; };
  const cols: Column<Row>[] = [
    { key: "ib", header: "User / IB", render: (r) => <div className="ix-user-cell"><div><div className="nm">{r.ibName}</div><div className="sub">IB · <UserLink id={r.ibUserId} /></div></div></div>, sortValue: (r) => r.ibName },
    { key: "u", header: "User ID", render: (r) => <UserLink id={r.traderId} />, sortValue: (r) => r.traderId },
    { key: "l", header: "Level", render: (r) => <span className="ix-badge blue">Level {r.level}</span>, sortValue: (r) => r.level },
    { key: "a", header: "Rebate Amount", align: "right", render: (r) => <b>{money(r.rebate)}</b>, sortValue: (r) => r.rebate },
    { key: "c", header: "Commission", align: "right", render: (r) => money(r.commission), sortValue: (r) => r.commission },
    { key: "d", header: "Date", render: (r) => fmtDate(r.at), sortValue: (r) => r.at },
    { key: "t", header: "Time", render: (r) => fmtTime(r.at) },
    { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} tone={r.status === "Distributed" ? "green" : r.status === "Pending" ? "amber" : "red"} /> },
  ];
  return (
    <>
      <PageHeader title="Rebate System" subtitle="Per-lot rebates paid up the IB network (5 levels). Each card has its own date and time filter." />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <RangeStatCard label="Total Rebate Commission" icon="ti-percentage" initial="all" compute={(r) => money(rows.filter((x) => inR(x.at, r)).reduce((s, x) => s + x.rebate, 0))} note="Generated to date" />
        <RangeStatCard label="Total Rebate Distribution" icon="ti-send" tone="green" initial="all" compute={(r) => money(rows.filter((x) => x.status === "Distributed" && inR(x.at, r)).reduce((s, x) => s + x.rebate, 0))} note="Paid out among IBs" />
        <RangeStatCard label="24 Hour Rebate Commission" icon="ti-clock-up" tone="amber" initial="24h" compute={(r) => money(rows.filter((x) => inR(x.at, r)).reduce((s, x) => s + x.rebate, 0))} />
        <RangeStatCard label="24 Hour Revenue Commission" icon="ti-coin" initial="24h" compute={(r) => money(revenue.filter((x) => inR(x.at, r)).reduce((s, x) => s + x.commission, 0))} note="Revenue Link commission" />
      </div>
      <div className="ix-grid two-one" style={{ marginBottom: 18 }}>
        <div className="ix-card" style={{ overflow: "hidden" }}>
          <div className="ix-card-h"><div><h3>Rebate history</h3><p>One row per IB payout, per trade and level</p></div></div>
          <div style={{ marginTop: 14 }}>
            <EntityTable embedded rows={rows} rowKey={(r) => r.id} columns={cols} searchText={(r) => `${r.ibName} ${r.ibUserId} ${r.traderId} ${r.tradeId}`} searchPlaceholder="Search IB, user ID or trade…"
              filters={[{ label: "Level", options: ["1", "2", "3", "4", "5"], get: (r) => String(r.level) }, { label: "Status", options: ["Distributed", "Pending", "On Hold"], get: (r) => r.status }]}
              dateGet={(r) => r.at} exportName="rebates" initialSort={{ key: "d", dir: "desc" }}
              exportRow={(r) => ({ IB: r.ibName, "IB User ID": r.ibUserId, "User ID": r.traderId, Level: r.level, Rebate: r.rebate, Commission: r.commission, Date: fmtDate(r.at), Time: fmtTime(r.at), Status: r.status })} />
          </div>
        </div>
        <Card title="Default rebate per lot" subtitle="Admins can override per IB in the user profile">
          <div className="ix-stack" style={{ gap: 10 }}>
            {REBATE_DEFAULT.map((v, i) => <div key={i} className="ix-row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eef2f8" }}><span>Level {i + 1}</span><b>{money(v)}</b></div>)}
          </div>
        </Card>
      </div>
    </>
  );
}
