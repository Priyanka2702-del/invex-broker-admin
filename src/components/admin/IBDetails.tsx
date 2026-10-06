"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, InfoGrid, NotFoundCard, UserLink, Avatar } from "./ui";
import StatusBadge from "./StatusBadge";
import StatCard from "./StatCard";
import ConfirmationModal from "./ConfirmationModal";
import DataTable, { Column } from "./DataTable";
import { useAdminData } from "@/context/AdminDataContext";
import { ibStats } from "@/lib/selectors";
import { IB_RATE } from "@/data/ibs";
import { fmtDate, money, num } from "@/lib/format";
import type { User } from "@/types/admin";

export default function IBDetails({ ibId }: { ibId: string }) {
  const d = useAdminData();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const ib = d.ibs.find((i) => i.id === ibId);
  if (!ib) return <NotFoundCard what={`IB ${ibId}`} backHref="/ib" />;
  const owner = d.users.find((u) => u.id === ib.userId)!;
  const st = ibStats(ib, d);
  const cols: Column<User>[] = [
    { key: "id", header: "User ID", render: (u) => <UserLink id={u.id} />, sortValue: (u) => u.id },
    { key: "n", header: "Name", render: (u) => <div className="ix-user-cell"><Avatar name={u.name} /><div><div className="nm">{u.name}</div><div className="sub">{u.email}</div></div></div> },
    { key: "b", header: "Balance", align: "right", render: (u) => money(u.balance), sortValue: (u) => u.balance },
    { key: "k", header: "KYC", render: (u) => <StatusBadge status={u.kycStatus} /> },
    { key: "s", header: "Status", render: (u) => <StatusBadge status={u.accountStatus} /> },
    { key: "d", header: "Joined", render: (u) => fmtDate(u.createdAt), sortValue: (u) => u.createdAt },
  ];
  return (
    <>
      <button className="ix-back" onClick={() => router.back()}><i className="ti ti-arrow-left" />Back</button>
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av"><i className="ti ti-network" /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{owner.name}</h1><span className="ix-badge blue">{ib.rank} IB</span><StatusBadge status={ib.status} /></div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}><b className="ix-mono">{ib.id}</b> · {ib.type} · owner <UserLink id={owner.id} /></div>
          </div>
          <button className={`ix-btn ${ib.status === "Active" ? "ix-btn-warn" : "ix-btn-ok"}`} onClick={() => setConfirm(true)}><i className={`ti ${ib.status === "Active" ? "ti-player-pause" : "ti-player-play"}`} />{ib.status === "Active" ? "Suspend IB" : "Activate IB"}</button>
        </div>
      </div>
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Referred users" value={num(st.referredCount)} icon="ti-users" note={`${st.activeUsers} active`} />
        <StatCard label="Revenue" value={money(st.revenue)} icon="ti-coin" tone="green" />
        <StatCard label="Commission" value={money(st.commission)} icon="ti-percentage" tone="amber" />
        <StatCard label="Trading volume" value={`${st.volume.toFixed(2)} lots`} icon="ti-chart-candle" />
      </div>
      <div className="ix-grid c2" style={{ marginBottom: 18 }}>
        <Card title="IB Information"><InfoGrid items={[["IB ID", <span className="ix-mono" key="a">{ib.id}</span>], ["Owner (User ID)", <UserLink key="b" id={owner.id} />], ["Owner email", owner.email], ["Created", fmtDate(ib.createdAt)], ["Referral link code", <span className="ix-mono" key="c">{ib.linkCode}</span>]]} /></Card>
        <Card title="Rank & Type"><InfoGrid items={[["IB Rank", `${ib.rank} IB`], ["IB Type", ib.type], ["Rate per lot", money(IB_RATE[ib.rank])], ["Status", <StatusBadge key="s" status={ib.status} />]]} /></Card>
      </div>
      <Card title="Referred users" subtitle="Click a User ID to open the client profile" flush>
        <DataTable rows={st.referred} columns={cols} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/users/${u.id}`)} emptyText="No referred users yet" />
      </Card>
      {confirm && <ConfirmationModal title={ib.status === "Active" ? "Suspend this IB?" : "Activate this IB?"} tone={ib.status === "Active" ? "warn" : "ok"} confirmLabel={ib.status === "Active" ? "Suspend" : "Activate"}
        message={<>{ib.status === "Active" ? "New referrals and commissions will pause for" : "Referrals and commissions will resume for"} <b>{owner.name}</b> ({ib.id}).</>}
        onConfirm={() => { d.toggleIB(ib.id); d.toast(`${ib.id} ${ib.status === "Active" ? "suspended" : "activated"}`, ib.status === "Active" ? "warn" : "ok"); }} onClose={() => setConfirm(false)} />}
    </>
  );
}
