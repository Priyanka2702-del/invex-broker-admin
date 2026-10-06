"use client";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import CreateRuleModal from "@/components/admin/CreateRuleModal";
import { PageHeader } from "@/components/admin/ui";
import { RULE_TYPES } from "@/data/rules";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDate } from "@/lib/format";
import type { Rule } from "@/types/admin";

export default function RulesPage() {
  const d = useAdminData();
  const [edit, setEdit] = useState<Rule | "new" | null>(null);
  const [del, setDel] = useState<Rule | null>(null);
  const label = (t: Rule["type"]) => RULE_TYPES.find((x) => x.value === t)?.label ?? t;
  const cols: Column<Rule>[] = [
    { key: "n", header: "Rule Name", render: (r) => <div><b>{r.name}</b><div className="ix-mono" style={{ color: "var(--ix-muted)" }}>{r.id}</div></div>, sortValue: (r) => r.name },
    { key: "d", header: "Description", render: (r) => <span style={{ display: "inline-block", maxWidth: 300, whiteSpace: "normal", color: "var(--ix-muted)" }}>{r.description}</span> },
    { key: "t", header: "Rule Type", render: (r) => label(r.type) },
    { key: "p", header: "Parameters", render: (r) => <span className="ix-mono">{Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}</span> },
    { key: "sv", header: "Severity", render: (r) => <StatusBadge status={r.severity} /> },
    { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "c", header: "Created Date", render: (r) => fmtDate(r.createdAt), sortValue: (r) => r.createdAt },
    { key: "a", header: "Actions", render: (r) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setEdit(r)}><i className="ti ti-pencil" />Edit</button>
        <button className={`ix-btn ix-btn-sm ${r.status === "Enabled" ? "ix-btn-warn" : "ix-btn-ok"}`} onClick={() => d.toggleRule(r.id)}>{r.status === "Enabled" ? "Disable" : "Enable"}</button>
        <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={() => setDel(r)} aria-label="Delete rule"><i className="ti ti-trash" /></button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Rules" subtitle="Custom trading rules evaluated by the backend rule engine on every trade."
        actions={<button className="ix-btn ix-btn-primary" onClick={() => setEdit("new")}><i className="ti ti-plus" />Create Rule</button>} />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Total rules" value={String(d.rules.length)} icon="ti-list-check" />
        <StatCard label="Enabled" value={String(d.rules.filter((r) => r.status === "Enabled").length)} icon="ti-shield-check" tone="green" />
        <StatCard label="Disabled" value={String(d.rules.filter((r) => r.status === "Disabled").length)} icon="ti-shield-off" tone="amber" />
      </div>
      <EntityTable rows={d.rules} columns={cols} rowKey={(r) => r.id} searchText={(r) => `${r.id} ${r.name} ${r.description}`} searchPlaceholder="Search rules…"
        filters={[{ label: "Status", options: ["Enabled", "Disabled"], get: (r) => r.status }, { label: "Severity", options: ["Low", "Medium", "High", "Critical"], get: (r) => r.severity }]}
        dateGet={(r) => r.createdAt} dateLabel="Created" exportName="rules"
        exportRow={(r) => ({ ID: r.id, Name: r.name, Type: label(r.type), Parameters: JSON.stringify(r.params), Severity: r.severity, Status: r.status, Created: fmtDate(r.createdAt) })} />
      {edit && <CreateRuleModal initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmationModal title="Delete this rule?" tone="danger" confirmLabel="Delete rule" message={<>“{del.name}” will stop being evaluated. Existing violation records are kept.</>} onConfirm={() => d.deleteRule(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
