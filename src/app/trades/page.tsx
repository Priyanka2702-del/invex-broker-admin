"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import { PageHeader, UserLink, IdLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { startOfToday } from "@/data/trades";
import { fmtDateTime, money, signedMoney } from "@/lib/format";
import type { Trade } from "@/types/admin";

export default function TradesPage() {
  const { trades } = useAdminData();
  const router = useRouter();
  const st = useMemo(() => {
    const t0 = startOfToday();
    const today = trades.filter((t) => t.closeTime && Date.parse(t.closeTime) >= t0);
    return {
      live: trades.filter((t) => t.status === "Open").length,
      profit: today.filter((t) => t.profit > 0).reduce((s, t) => s + t.profit, 0),
      loss: today.filter((t) => t.profit < 0).reduce((s, t) => s + t.profit, 0),
    };
  }, [trades]);
  const px = (t: Trade, v: number | null) => (v === null ? "—" : v.toFixed(t.digits));
  const cols: Column<Trade>[] = [
    { key: "id", header: "Trade ID", render: (t) => <IdLink href={`/trades/${t.id}`}>{t.id}</IdLink>, sortValue: (t) => t.id },
    { key: "u", header: "User ID", render: (t) => <UserLink id={t.userId} />, sortValue: (t) => t.userId },
    { key: "a", header: "Account ID", render: (t) => <span className="ix-mono">{t.accountId}</span> },
    { key: "s", header: "Symbol", render: (t) => <b>{t.symbol}</b>, sortValue: (t) => t.symbol },
    { key: "side", header: "Buy/Sell", render: (t) => <StatusBadge status={t.side} /> },
    { key: "v", header: "Volume", align: "right", render: (t) => t.volume.toFixed(2), sortValue: (t) => t.volume },
    { key: "op", header: "Open Price", align: "right", render: (t) => px(t, t.openPrice) },
    { key: "cp", header: "Close Price", align: "right", render: (t) => px(t, t.closePrice) },
    { key: "ot", header: "Open Time", render: (t) => fmtDateTime(t.openTime), sortValue: (t) => t.openTime },
    { key: "ct", header: "Close Time", render: (t) => fmtDateTime(t.closeTime), sortValue: (t) => t.closeTime ?? "" },
    { key: "pl", header: "Profit/Loss", align: "right", render: (t) => <span className={t.profit >= 0 ? "pos" : "neg"}>{signedMoney(t.profit)}</span>, sortValue: (t) => t.profit },
    { key: "st", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];
  return (
    <>
      <PageHeader title="All Trades" subtitle="Every order executed on client MT5 accounts. Click a trade for full execution history." />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Total Live Trades" value={String(st.live)} icon="ti-activity" note="Currently open positions" />
        <StatCard label="Today's Total Profit" value={money(st.profit)} icon="ti-trending-up" tone="green" note="Trades closed today (UTC)" />
        <StatCard label="Today's Total Loss" value={money(Math.abs(st.loss))} icon="ti-trending-down" tone="red" note="Trades closed today (UTC)" />
      </div>
      <EntityTable rows={trades} columns={cols} rowKey={(t) => t.id} onRowClick={(t) => router.push(`/trades/${t.id}`)}
        searchText={(t) => `${t.id} ${t.userId} ${t.accountId} ${t.symbol}`} searchPlaceholder="Search trade ID, user ID, account or symbol…"
        filters={[
          { label: "Symbol", options: Array.from(new Set(trades.map((t) => t.symbol))), get: (t) => t.symbol },
          { label: "Account", options: Array.from(new Set(trades.map((t) => t.accountId))).sort(), get: (t) => t.accountId },
          { label: "Buy/Sell", options: ["BUY", "SELL"], get: (t) => t.side }, { label: "Status", options: ["Open", "Closed"], get: (t) => t.status },
        ]}
        dateGet={(t) => t.openTime} dateLabel="Opened" exportName="trades" initialSort={{ key: "ot", dir: "desc" }}
        exportRow={(t) => ({ "Trade ID": t.id, "User ID": t.userId, Account: t.accountId, Symbol: t.symbol, Side: t.side, Volume: t.volume, "Open Price": t.openPrice, "Close Price": t.closePrice ?? "", "Open Time": fmtDateTime(t.openTime), "Close Time": fmtDateTime(t.closeTime), "P/L": t.profit, Status: t.status })} />
    </>
  );
}
