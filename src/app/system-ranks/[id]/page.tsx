"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { Modal } from "@/components/admin/ConfirmationModal";
import CreateRankModal from "@/components/admin/CreateRankModal";
import { Card, NotFoundCard, UserLink, Avatar } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDate, money } from "@/lib/format";
import type { User } from "@/types/admin";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const d = useAdminData();
  const router = useRouter();
  const [assign, setAssign] = useState(false);
  const [edit, setEdit] = useState(false);
  const [pick, setPick] = useState("");
  const rank = d.ranks.find((r) => r.id === id);
  if (!rank) return <NotFoundCard what={`System rank ${id}`} backHref="/system-ranks" />;
  const members = d.users.filter((u) => u.systemRankId === id);
  const free = d.users.filter((u) => u.systemRankId !== id);
  const cols: Column<User>[] = [
    { key: "id", header: "User ID", render: (u) => <UserLink id={u.id} />, sortValue: (u) => u.id },
    { key: "n", header: "Name", render: (u) => <div className="ix-user-cell"><Avatar name={u.name} /><div><div className="nm">{u.name}</div><div className="sub">{u.email}</div></div></div> },
    { key: "b", header: "Balance", align: "right", render: (u) => money(u.balance), sortValue: (u) => u.balance },
    { key: "s", header: "Status", render: (u) => <StatusBadge status={u.accountStatus} /> },
    { key: "a", header: "Actions", render: (u) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`/users/${u.id}`); }}><i className="ti ti-eye" />View</button>
        <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={(e) => { e.stopPropagation(); d.removeFromRank(u.id); }}><i className="ti ti-user-minus" />Remove</button>
      </div>) },
  ];
  return (
    <>
      <button className="ix-back" onClick={() => router.push("/system-ranks")}><i className="ti ti-arrow-left" />Back to system ranks</button>
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av"><i className="ti ti-award" /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{rank.name}</h1><StatusBadge status={rank.status} /></div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}>{rank.description} · created {fmtDate(rank.createdAt)} · {members.length} user(s)</div>
          </div>
          <div className="ix-row">
            <button className="ix-btn ix-btn-outline" onClick={() => setEdit(true)}><i className="ti ti-pencil" />Edit</button>
            <button className="ix-btn ix-btn-primary" onClick={() => { setPick(free[0]?.id ?? ""); setAssign(true); }}><i className="ti ti-user-plus" />Assign User</button>
          </div>
        </div>
      </div>
      <Card title="Users in this rank" flush>
        <DataTable rows={members} columns={cols} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/users/${u.id}`)} emptyText="No users assigned to this rank yet" />
      </Card>
      {edit && <CreateRankModal initial={rank} onClose={() => setEdit(false)} />}
      {assign && (
        <Modal title={`Assign user to ${rank.name}`} onClose={() => setAssign(false)} footer={<>
          <button className="ix-btn ix-btn-outline" onClick={() => setAssign(false)}>Cancel</button>
          <button className="ix-btn ix-btn-primary" disabled={!pick} onClick={() => { d.assignRank(pick, rank.id); setAssign(false); }}>Assign</button></>}>
          A user can hold one system rank; assigning moves them from their current rank.
          <div className="ix-field"><label>User</label>
            <select className="ix-select" value={pick} onChange={(e) => setPick(e.target.value)}>
              {free.map((u) => <option key={u.id} value={u.id}>{u.id} — {u.name}{u.systemRankId ? ` (${d.ranks.find((r) => r.id === u.systemRankId)?.name})` : ""}</option>)}
            </select></div>
        </Modal>
      )}
    </>
  );
}
