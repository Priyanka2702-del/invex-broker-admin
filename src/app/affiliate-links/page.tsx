"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { IdLink, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { useExtras } from "@/context/AdminExtrasContext";
import { buildLinks, type LinkRow } from "@/lib/links";

export default function AffiliateLinksPage() {
  const { users, ibs } = useAdminData();
  const { linkStatus, toggleLink } = useExtras();
  const router = useRouter();
  const rows = useMemo(() => buildLinks(users, ibs), [users, ibs]);
  const st = (r: LinkRow) => linkStatus[r.id] ?? "Active";
  const cols: Column<LinkRow>[] = [
    { key: "id", header: "Link ID", render: (r) => <IdLink href={`/affiliate-links/${r.id}`}>{r.id}</IdLink> },
    { key: "u", header: "User", render: (r) => <div><b>{r.user.name}</b><div style={{ fontSize: 12 }}><UserLink id={r.user.id} /></div></div>, sortValue: (r) => r.user.name },
    { key: "k", header: "Link type", render: (r) => <span className={`ix-badge ${r.kind === "Rebate Link" ? "blue" : "orange"}`}>{r.kind}</span> },
    { key: "c", header: "Code", render: (r) => <span className="ix-mono">{r.code}</span> },
    { key: "a", header: "Approval", render: (r) => <StatusBadge status={r.approval} /> },
    { key: "n", header: "Referrals", align: "right", render: (r) => r.referrals.length, sortValue: (r) => r.referrals.length },
    { key: "s", header: "Link status", render: (r) => <StatusBadge status={st(r)} /> },
    { key: "x", header: "Action", render: (r) => <div className="ix-act"><button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`/affiliate-links/${r.id}`); }}><i className="ti ti-eye" />View</button>
      <button className={`ix-btn ix-btn-sm ${st(r) === "Active" ? "ix-btn-warn" : "ix-btn-ok"}`} onClick={(e) => { e.stopPropagation(); toggleLink(r.id); }}>{st(r) === "Active" ? "Disable" : "Enable"}</button></div> },
  ];
  return (
    <>
      <PageHeader title="Affiliate / Links" subtitle="Rebate and Revenue links, approval state and referral details. A Revenue Link appears in the user's Affiliate Program only once approved." />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Rebate Links" value={String(rows.filter((r) => r.kind === "Rebate Link").length)} icon="ti-link" />
        <StatCard label="Revenue Links (approved)" value={String(rows.filter((r) => r.kind === "Revenue Link" && r.approval === "Approved").length)} icon="ti-circle-check" tone="green" />
        <StatCard label="Awaiting approval" value={String(rows.filter((r) => r.approval === "Pending").length)} icon="ti-clock" tone="amber" />
        <StatCard label="Total referrals" value={String(rows.reduce((s, r) => s + r.referrals.length, 0))} icon="ti-users" />
      </div>
      <EntityTable rows={rows} rowKey={(r) => r.id} columns={cols} onRowClick={(r) => router.push(`/affiliate-links/${r.id}`)} searchText={(r) => `${r.id} ${r.user.name} ${r.user.id} ${r.code}`} searchPlaceholder="Search user, link ID or code…"
        filters={[{ label: "Type", options: ["Rebate Link", "Revenue Link"], get: (r) => r.kind }, { label: "Approval", options: ["Approved", "Pending", "Rejected"], get: (r) => r.approval }, { label: "Status", options: ["Active", "Disabled"], get: (r) => st(r) }]}
        exportName="affiliate-links" exportRow={(r) => ({ "Link ID": r.id, User: r.user.name, "User ID": r.user.id, Type: r.kind, Code: r.code, Approval: r.approval, Referrals: r.referrals.length, Status: st(r) })} />
    </>
  );
}
