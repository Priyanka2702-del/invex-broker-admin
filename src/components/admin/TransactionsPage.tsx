"use client";
/** Shared list view for Deposit Management and Withdraw Management. */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import EntityTable from "./EntityTable";
import type { Column } from "./DataTable";
import StatusBadge from "./StatusBadge";
import StatCard from "./StatCard";
import Tabs from "./Tabs";
import { PageHeader, UserLink, IdLink } from "./ui";
import { useAdminData } from "@/context/AdminDataContext";
import { NOW, fmtDateTime, money } from "@/lib/format";
import type { Deposit, TxStatus, Withdrawal } from "@/types/admin";

type Tx = Deposit | Withdrawal;
export default function TransactionsPage({ kind }: { kind: "deposit" | "withdrawal" }) {
  const d = useAdminData();
  const router = useRouter();
  const [tab, setTab] = useState("total");
  const dep = kind === "deposit";
  const all: Tx[] = dep ? d.deposits : d.withdrawals;
  const base = dep ? "/deposits" : "/withdrawals";
  const word = dep ? "Deposit" : "Withdraw";
  const count = (s: TxStatus) => all.filter((x) => x.status === s).length;
  const sum = (s?: TxStatus) => all.filter((x) => !s || x.status === s).reduce((a, x) => a + x.amount, 0);
  const rows = useMemo(() => all.filter((x) => tab === "total" || x.status.toLowerCase() === tab), [all, tab]);
  const name = (id: string) => d.users.find((u) => u.id === id)?.name ?? id;
  const cols: Column<Tx>[] = [
    { key: "id", header: `${word} ID`, render: (x) => <IdLink href={`${base}/${x.id}`}>{x.id}</IdLink>, sortValue: (x) => x.id },
    { key: "uid", header: "User ID", render: (x) => <UserLink id={x.userId} />, sortValue: (x) => x.userId },
    { key: "un", header: "User Name", render: (x) => <b>{name(x.userId)}</b> },
    { key: "amt", header: "Amount", align: "right", render: (x) => <b>{money(x.amount)}</b>, sortValue: (x) => x.amount },
    { key: "m", header: "Payment Method", render: (x) => x.method },
    { key: "tx", header: "Transaction ID", render: (x) => <span className="ix-mono" title={x.txId}>{x.txId.length > 18 ? `${x.txId.slice(0, 8)}…${x.txId.slice(-6)}` : x.txId}</span> },
    { key: "st", header: "Status", render: (x) => <StatusBadge status={x.status} />, sortValue: (x) => x.status },
    { key: "dt", header: "Date/Time", render: (x) => fmtDateTime(x.createdAt), sortValue: (x) => x.createdAt },
    { key: "a", header: "Actions", render: (x) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`${base}/${x.id}`); }}><i className="ti ti-eye" />Details</button>
        {x.status === "Pending" && <>
          <button className="ix-btn ix-btn-sm ix-btn-ok" onClick={(e) => { e.stopPropagation(); (dep ? d.reviewDeposit : d.reviewWithdrawal)(x.id, "Successful"); }} aria-label="Approve"><i className="ti ti-check" /></button>
          <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={(e) => { e.stopPropagation(); (dep ? d.reviewDeposit : d.reviewWithdrawal)(x.id, "Rejected", "Rejected by admin"); }} aria-label="Reject"><i className="ti ti-x" /></button>
        </>}
      </div>) },
  ];
  return (
    <>
      <PageHeader title={`${dep ? "Deposit" : "Withdraw"} Management`} subtitle={dep ? "Review incoming client deposits and their payment references." : "Review and process client withdrawal requests."} />
      <div className="ix-grid stats" style={{ marginBottom: 18 }}>
        <StatCard label={`Total ${word}`} value={money(sum())} icon={dep ? "ti-arrow-bar-to-down" : "ti-arrow-bar-to-up"} note={`${all.length} requests`} />
        <StatCard label="Successful" value={money(sum("Successful"))} icon="ti-circle-check" tone="green" note={`${count("Successful")} requests`} />
        <StatCard label="Pending" value={money(sum("Pending"))} icon="ti-clock" tone="amber" note={`${count("Pending")} awaiting review`} />
        <StatCard label="Rejected" value={money(sum("Rejected"))} icon="ti-circle-x" tone="red" note={`${count("Rejected")} requests`} />
        <StatCard label={`24 Hour ${word}s`} value={money(all.filter((x) => Date.parse(x.createdAt) >= NOW - 24 * 3_600_000).reduce((a, x) => a + x.amount, 0))} icon="ti-clock-up" note={`${all.filter((x) => Date.parse(x.createdAt) >= NOW - 24 * 3_600_000).length} requests`} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: "successful", label: `Successful ${word}`, count: count("Successful") }, { id: "rejected", label: `Rejected ${word}`, count: count("Rejected") },
          { id: "pending", label: `Pending ${word}`, count: count("Pending") }, { id: "total", label: `Total ${word}`, count: all.length },
        ]} />
      </div>
      <EntityTable rows={rows} columns={cols} rowKey={(x) => x.id} onRowClick={(x) => router.push(`${base}/${x.id}`)}
        searchText={(x) => `${x.id} ${x.userId} ${name(x.userId)} ${x.txId}`} searchPlaceholder="Search ID, user ID, name or transaction ID…"
        filters={[{ label: "Status", options: ["Successful", "Pending", "Rejected"], get: (x) => x.status }, { label: "Method", options: Array.from(new Set(all.map((x) => x.method))), get: (x) => x.method }, { label: "User", options: Array.from(new Set(all.map((x) => `${x.userId} · ${name(x.userId)}`))).sort(), get: (x) => `${x.userId} · ${name(x.userId)}` }]}
        dateGet={(x) => x.createdAt} amountGet={(x) => x.amount} exportName={dep ? "deposits" : "withdrawals"} initialSort={{ key: "dt", dir: "desc" }}
        exportRow={(x) => ({ ID: x.id, "User ID": x.userId, "User Name": name(x.userId), Amount: x.amount, Method: x.method, "Transaction ID": x.txId, Status: x.status, "Date/Time": fmtDateTime(x.createdAt) })} />
    </>
  );
}
