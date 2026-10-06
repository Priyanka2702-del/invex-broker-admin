"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import ViolationActions from "@/components/admin/ViolationActions";
import { PageHeader, UserLink, IdLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime } from "@/lib/format";
import type { Violation } from "@/types/admin";

const SEV = { Low: 0, Medium: 1, High: 2, Critical: 3 } as const;
export default function ViolationsPage() {
  const { violations, rules } = useAdminData();
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const rows = useMemo(() => violations.filter((v) => tab === "all" || v.status === tab), [violations, tab]);
  const c = (s: string) => violations.filter((v) => v.status === s).length;
  const cols: Column<Violation>[] = [
    { key: "id", header: "Violation ID", render: (v) => <IdLink href={`/risk/violations/${v.id}`}>{v.id}</IdLink>, sortValue: (v) => v.id },
    { key: "u", header: "User ID", render: (v) => <UserLink id={v.userId} />, sortValue: (v) => v.userId },
    { key: "r", header: "Rule Name", render: (v) => <b>{v.ruleName}</b> },
    { key: "t", header: "Trade ID", render: (v) => <IdLink href={`/trades/${v.tradeId}`}>{v.tradeId}</IdLink> },
    { key: "s", header: "Symbol", render: (v) => v.symbol },
    { key: "vt", header: "Violation Type", render: (v) => v.type },
    { key: "d", header: "Date/Time", render: (v) => fmtDateTime(v.createdAt), sortValue: (v) => v.createdAt },
    { key: "sv", header: "Severity", render: (v) => <StatusBadge status={v.severity} />, sortValue: (v) => SEV[v.severity] },
    { key: "st", header: "Status", render: (v) => <StatusBadge status={v.status} />, sortValue: (v) => v.status },
    { key: "a", header: "Action", render: (v) => <ViolationActions v={v} compact /> },
  ];
  return (
    <>
      <PageHeader title="Violations" subtitle="Records created automatically when the rule engine flags a trade. Demo data shown — connect to your risk service to stream live violations." />
      <div style={{ marginBottom: 16 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: "all", label: "All", count: violations.length }, { id: "Open", label: "Open", count: c("Open") }, { id: "Warned", label: "Warned", count: c("Warned") }, { id: "Cleared", label: "Cleared", count: c("Cleared") }, { id: "Banned", label: "Banned", count: c("Banned") }]} />
      </div>
      <EntityTable rows={rows} columns={cols} rowKey={(v) => v.id} onRowClick={(v) => router.push(`/risk/violations/${v.id}`)}
        searchText={(v) => `${v.id} ${v.userId} ${v.ruleName} ${v.tradeId} ${v.symbol}`} searchPlaceholder="Search violation, user, trade or rule…"
        filters={[{ label: "Rule", options: rules.map((r) => r.name), get: (v) => v.ruleName }, { label: "Severity", options: ["Low", "Medium", "High", "Critical"], get: (v) => v.severity }, { label: "Symbol", options: Array.from(new Set(violations.map((v) => v.symbol))), get: (v) => v.symbol }]}
        dateGet={(v) => v.createdAt} exportName="violations" initialSort={{ key: "d", dir: "desc" }}
        exportRow={(v) => ({ ID: v.id, "User ID": v.userId, Rule: v.ruleName, "Trade ID": v.tradeId, Symbol: v.symbol, Type: v.type, "Date/Time": fmtDateTime(v.createdAt), Severity: v.severity, Status: v.status })} />
    </>
  );
}
