"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { Card, InfoGrid, NotFoundCard, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { useExtras } from "@/context/AdminExtrasContext";
import { buildLinks } from "@/lib/links";
import { fmtDate, money } from "@/lib/format";
import type { User } from "@/types/admin";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { users, ibs, setRevenueLink } = useAdminData();
  const { linkStatus, toggleLink } = useExtras();
  const router = useRouter();
  const link = buildLinks(users, ibs).find((l) => l.id === id);
  if (!link) return <NotFoundCard what={`Link ${id}`} backHref="/affiliate-links" />;
  const status = linkStatus[id] ?? "Active";
  const cols: Column<User>[] = [
    { key: "i", header: "User ID", render: (u) => <UserLink id={u.id} />, sortValue: (u) => u.id },
    { key: "n", header: "Name", render: (u) => <b>{u.name}</b> },
    { key: "k", header: "KYC", render: (u) => <StatusBadge status={u.kycStatus} /> },
    { key: "b", header: "Balance", align: "right", render: (u) => money(u.balance), sortValue: (u) => u.balance },
    { key: "d", header: "Joined", render: (u) => fmtDate(u.createdAt), sortValue: (u) => u.createdAt },
  ];
  return (
    <>
      <button className="ix-back" onClick={() => router.push("/affiliate-links")}><i className="ti ti-arrow-left" />All links</button>
      <PageHeader title={`${link.kind} — ${link.user.name}`} subtitle={`Link ${link.id} · code ${link.code}`}
        actions={<>
          {link.kind === "Revenue Link" && link.approval !== "Approved" && <button className="ix-btn ix-btn-ok" onClick={() => setRevenueLink(link.user.id, "Approved")}><i className="ti ti-check" />Approve</button>}
          {link.kind === "Revenue Link" && link.approval !== "Rejected" && <button className="ix-btn ix-btn-danger" onClick={() => setRevenueLink(link.user.id, "Rejected")}><i className="ti ti-x" />{link.approval === "Approved" ? "Revoke" : "Reject"}</button>}
          <button className="ix-btn ix-btn-outline" onClick={() => toggleLink(id)}>{status === "Active" ? "Disable link" : "Enable link"}</button>
        </>} />
      {link.kind === "Revenue Link" && <div className={`ix-banner ${link.approval === "Approved" ? "blue" : "amber"}`}><i className="ti ti-info-circle" /><div>{link.approval === "Approved" ? "User Dashboard → Affiliate Program shows the Revenue Link." : "Not approved — the user's Affiliate Program shows only the Rebate Link."}</div></div>}
      <div className="ix-grid c2" style={{ marginBottom: 18 }}>
        <Card title="Link information"><InfoGrid items={[["Link ID", <span className="ix-mono" key="a">{link.id}</span>], ["Type", link.kind], ["Code", <span className="ix-mono" key="b">{link.code}</span>], ["Approval", <StatusBadge key="c" status={link.approval} />], ["Link status", <StatusBadge key="d" status={status} />]]} /></Card>
        <Card title="Owner"><InfoGrid items={[["User", <UserLink key="u" id={link.user.id} name={`${link.user.name} (${link.user.id})`} />], ["Email", link.user.email], ["Referrals", link.referrals.length]]} /></Card>
      </div>
      <Card title="Referral details" flush><DataTable rows={link.referrals} columns={cols} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/users/${u.id}`)} emptyText="No referrals via this link yet" /></Card>
    </>
  );
}
