"use client";
import { useAdminData } from "@/context/AdminDataContext";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { PageHeader, UserLink } from "@/components/admin/ui";
import { fmtDate, fmtTime } from "@/lib/format";
import type { AuditLog } from "@/types/admin";

export default function AuditLogsPage() {
  const { auditLogs } = useAdminData();
  const cols: Column<AuditLog>[] = [
    { key: "a", header: "Admin", render: (l) => <b>{l.admin}</b>, sortValue: (l) => l.admin },
    { key: "ac", header: "Action", render: (l) => <span className="ix-badge blue">{l.action}</span>, sortValue: (l) => l.action },
    { key: "u", header: "User affected", render: (l) => (l.userId ? <UserLink id={l.userId} /> : <span style={{ color: "var(--ix-faint)" }}>—</span>) },
    { key: "m", header: "Module", render: (l) => l.module, sortValue: (l) => l.module },
    { key: "d", header: "Description", render: (l) => <span style={{ display: "inline-block", maxWidth: 380, whiteSpace: "normal" }}>{l.description}</span> },
    { key: "dt", header: "Date", render: (l) => fmtDate(l.timestamp), sortValue: (l) => l.timestamp },
    { key: "t", header: "Time", render: (l) => fmtTime(l.timestamp) },
    { key: "ts", header: "Timestamp", render: (l) => <span className="ix-mono" style={{ color: "var(--ix-muted)" }}>{l.timestamp}</span> },
  ];
  const uniq = (f: (l: AuditLog) => string) => [...new Set(auditLogs.map(f))].sort();
  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Every admin action. Actions taken in this session appear at the top." />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Log entries" value={String(auditLogs.length)} icon="ti-history" />
        <StatCard label="Admins active" value={String(new Set(auditLogs.map((l) => l.admin)).size)} icon="ti-user-shield" tone="green" />
        <StatCard label="Modules touched" value={String(new Set(auditLogs.map((l) => l.module)).size)} icon="ti-apps" tone="amber" />
      </div>
      <EntityTable rows={auditLogs} rowKey={(l) => l.id} columns={cols} searchText={(l) => `${l.admin} ${l.action} ${l.module} ${l.description} ${l.userId ?? ""}`} searchPlaceholder="Search logs, user ID…"
        filters={[{ label: "Admin", options: uniq((l) => l.admin), get: (l) => l.admin }, { label: "Module", options: uniq((l) => l.module), get: (l) => l.module }, { label: "Action", options: uniq((l) => l.action), get: (l) => l.action }]}
        dateGet={(l) => l.timestamp} exportName="audit-logs" initialSort={{ key: "dt", dir: "desc" }}
        exportRow={(l) => ({ Admin: l.admin, Action: l.action, "User affected": l.userId ?? "", Module: l.module, Description: l.description, Date: fmtDate(l.timestamp), Time: fmtTime(l.timestamp), Timestamp: l.timestamp })} />
    </>
  );
}
