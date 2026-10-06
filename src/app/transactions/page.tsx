"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import { IdLink, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime, money } from "@/lib/format";

type Tx = { id: string; kind: "Deposit" | "Withdrawal"; userId: string; amount: number; method: string; status: string; createdAt: string; href: string };
export default function TransactionsOverviewPage() {
  const { deposits, withdrawals, users } = useAdminData();
  const router = useRouter();
  const rows = useMemo<Tx[]>(() => [
    ...deposits.map((d) => ({ id: d.id, kind: "Deposit" as const, userId: d.userId, amount: d.amount, method: d.method, status: d.status, createdAt: d.createdAt, href: `/deposits/${d.id}` })),
    ...withdrawals.map((d) => ({ id: d.id, kind: "Withdrawal" as const, userId: d.userId, amount: d.amount, method: d.method, status: d.status, createdAt: d.createdAt, href: `/withdrawals/${d.id}` })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [deposits, withdrawals]);
  const nm = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const net = deposits.filter((d) => d.status === "Successful").reduce((s, d) => s + d.amount, 0) - withdrawals.filter((d) => d.status === "Successful").reduce((s, d) => s + d.amount, 0);
  const cols: Column<Tx>[] = [
    { key: "id", header: "Transaction ID", render: (t) => <IdLink href={t.href}>{t.id}</IdLink>, sortValue: (t) => t.id },
    { key: "k", header: "Type", render: (t) => <span className={`ix-badge ${t.kind === "Deposit" ? "green" : "orange"}`}>{t.kind}</span> },
    { key: "u", header: "User", render: (t) => <div><b>{nm(t.userId)}</b><div style={{ fontSize: 12 }}><UserLink id={t.userId} /></div></div> },
    { key: "a", header: "Amount", align: "right", render: (t) => <b>{money(t.amount)}</b>, sortValue: (t) => t.amount },
    { key: "m", header: "Method", render: (t) => t.method },
    { key: "s", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "d", header: "Date/Time", render: (t) => fmtDateTime(t.createdAt), sortValue: (t) => t.createdAt },
  ];
  return (
    <>
      <PageHeader title="Transactions" subtitle="All deposits and withdrawals in one feed. Use Deposits / Withdrawals for approvals and details." />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Transactions" value={String(rows.length)} icon="ti-arrows-exchange" />
        <StatCard label="Net successful flow" value={money(net)} icon="ti-scale" tone="green" note="Deposits − withdrawals" />
        <StatCard label="Awaiting review" value={String(rows.filter((r) => r.status === "Pending").length)} icon="ti-clock" tone="amber" />
      </div>
      <EntityTable rows={rows} rowKey={(t) => t.id} columns={cols} onRowClick={(t) => router.push(t.href)} searchText={(t) => `${t.id} ${t.userId} ${nm(t.userId)}`} searchPlaceholder="Search transaction or user…"
        filters={[{ label: "Type", options: ["Deposit", "Withdrawal"], get: (t) => t.kind }, { label: "Status", options: ["Successful", "Pending", "Rejected"], get: (t) => t.status }, { label: "Method", options: [...new Set(rows.map((r) => r.method))], get: (t) => t.method }]}
        dateGet={(t) => t.createdAt} amountGet={(t) => t.amount} exportName="transactions" initialSort={{ key: "d", dir: "desc" }}
        exportRow={(t) => ({ ID: t.id, Type: t.kind, "User ID": t.userId, Amount: t.amount, Method: t.method, Status: t.status, "Date/Time": fmtDateTime(t.createdAt) })} />
    </>
  );
}
