"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import EntityTable from "./EntityTable";
import type { Column } from "./DataTable";
import StatusBadge from "./StatusBadge";
import StatCard from "./StatCard";
import { PageHeader, UserLink, IdLink, Avatar } from "./ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDate, money, num } from "@/lib/format";
import type { User } from "@/types/admin";

export type ClientsVariant = "all" | "balance" | "banned" | "unkyc" | "kyc-approved" | "direct" | "revenue-link";
const META: Record<ClientsVariant, { title: string; sub: string; test: (u: User) => boolean }> = {
  all: { title: "All Users", sub: "Every registered client across all registration sources.", test: () => true },
  balance: { title: "Users With Balance", sub: "Clients holding a wallet balance greater than zero.", test: (u) => u.balance > 0 },
  banned: { title: "Banned Users", sub: "Accounts blocked from trading and withdrawals.", test: (u) => u.accountStatus === "Banned" },
  unkyc: { title: "UnKYC Users", sub: "Clients whose identity verification is not approved yet.", test: (u) => u.kycStatus !== "Approved" },
  "kyc-approved": { title: "KYC Approved Users", sub: "Fully verified clients.", test: (u) => u.kycStatus === "Approved" },
  direct: { title: "Direct Users", sub: "Clients who registered without an IB link.", test: (u) => u.registrationType === "Direct" },
  "revenue-link": { title: "Revenue Link Users", sub: "Clients who registered through a Revenue Link IB.", test: (u) => u.registrationType === "Revenue Link" },
};

export default function ClientsTable({ variant }: { variant: ClientsVariant }) {
  const { users } = useAdminData();
  const router = useRouter();
  const m = META[variant];
  const rows = useMemo(() => users.filter(m.test), [users, m]);
  const columns: Column<User>[] = [
    { key: "id", header: "User ID", render: (u) => <UserLink id={u.id} />, sortValue: (u) => u.id },
    { key: "name", header: "Name", render: (u) => <div className="ix-user-cell"><Avatar name={u.name} /><div><div className="nm">{u.name}</div><div className="sub">{u.country}</div></div></div>, sortValue: (u) => u.name },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "acc", header: "Account", render: (u) => <span className="ix-mono">{u.accountId}</span> },
    { key: "bal", header: "Balance", align: "right", render: (u) => <b>{money(u.balance)}</b>, sortValue: (u) => u.balance },
    { key: "kyc", header: "KYC Status", render: (u) => <StatusBadge status={u.kycStatus} />, sortValue: (u) => u.kycStatus },
    { key: "st", header: "Account Status", render: (u) => <StatusBadge status={u.accountStatus} />, sortValue: (u) => u.accountStatus },
    { key: "ib", header: "IB", render: (u) => (u.ibId ? <IdLink href={`/ib/profile/${u.ibId}`}>{u.ibId}</IdLink> : <span style={{ color: "var(--ix-faint)" }}>—</span>) },
    { key: "reg", header: "Registration Type", render: (u) => u.registrationType },
    { key: "date", header: "Created Date", render: (u) => fmtDate(u.createdAt), sortValue: (u) => u.createdAt },
    { key: "act", header: "Actions", render: (u) => <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`/users/${u.id}`); }}><i className="ti ti-eye" />View</button> },
  ];
  const total = rows.reduce((s, u) => s + u.balance, 0);
  return (
    <>
      <PageHeader title={m.title} subtitle={m.sub} />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Users in this view" value={num(rows.length)} icon="ti-users" />
        <StatCard label="Combined wallet balance" value={money(total)} icon="ti-wallet" tone="green" />
        <StatCard label="KYC approved" value={num(rows.filter((u) => u.kycStatus === "Approved").length)} icon="ti-shield-check" tone="amber" note={`${rows.length ? Math.round((rows.filter((u) => u.kycStatus === "Approved").length / rows.length) * 100) : 0}% of this view`} />
      </div>
      <EntityTable
        rows={rows} rowKey={(u) => u.id} columns={columns} onRowClick={(u) => router.push(`/users/${u.id}`)}
        searchText={(u) => `${u.id} ${u.name} ${u.email} ${u.accountId}`} searchPlaceholder="Search ID, name, email or account…"
        filters={[
          { label: "KYC", options: ["Approved", "Pending", "Unverified", "Rejected"], get: (u) => u.kycStatus },
          { label: "Status", options: ["Active", "Warned", "Banned", "Pending", "Approved"], get: (u) => u.accountStatus },
          { label: "Registration", options: ["Direct", "Rebate Link", "Revenue Link"], get: (u) => u.registrationType },
        ]}
        dateGet={(u) => u.createdAt} dateLabel="Created" amountGet={(u) => u.balance}
        exportName={`clients-${variant}`} initialSort={{ key: "date", dir: "desc" }}
        exportRow={(u) => ({ "User ID": u.id, Name: u.name, Email: u.email, Account: u.accountId, Balance: u.balance, KYC: u.kycStatus, Status: u.accountStatus, IB: u.ibId ?? "", Registration: u.registrationType, Created: fmtDate(u.createdAt) })}
      />
    </>
  );
}
