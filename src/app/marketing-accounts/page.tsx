"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import ConfirmationModal, { Modal } from "@/components/admin/ConfirmationModal";
import { PageHeader, UserLink, Avatar } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDate } from "@/lib/format";
import type { User } from "@/types/admin";

export default function MarketingAccountsPage() {
  const d = useAdminData();
  const router = useRouter();
  const [pickOpen, setPickOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [confirmAdd, setConfirmAdd] = useState<User | null>(null);
  const [remove, setRemove] = useState<User | null>(null);
  const rows = d.users.filter((u) => u.marketing);
  const candidates = d.users.filter((u) => !u.marketing && u.accountStatus !== "Banned");
  const cols: Column<User>[] = [
    { key: "id", header: "User ID", render: (u) => <UserLink id={u.id} />, sortValue: (u) => u.id },
    { key: "n", header: "Name", render: (u) => <div className="ix-user-cell"><Avatar name={u.name} /><b>{u.name}</b></div>, sortValue: (u) => u.name },
    { key: "e", header: "Email", render: (u) => u.email },
    { key: "a", header: "Account", render: (u) => <span className="ix-mono">{u.accountId}</span> },
    { key: "s", header: "Status", render: (u) => <StatusBadge status={u.accountStatus} /> },
    { key: "d", header: "Assigned Date", render: (u) => fmtDate(u.marketing!.assignedAt), sortValue: (u) => u.marketing!.assignedAt },
    { key: "dd", header: "Dummy Dollars", align: "right", render: (u) => `$${u.marketing!.dummyDollars.toLocaleString("en-US")}` },
    { key: "by", header: "Approved By", render: (u) => u.marketing!.approvedBy },
    { key: "act", header: "Actions", render: (u) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`/users/${u.id}`); }}><i className="ti ti-eye" />View</button>
        <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={(e) => { e.stopPropagation(); setRemove(u); }}><i className="ti ti-user-minus" />Remove Marketing Status</button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Marketing Accounts" subtitle="Normal users promoted to Marketing Accounts after admin approval."
        actions={<button className="ix-btn ix-btn-primary" onClick={() => { setPick(candidates[0]?.id ?? ""); setPickOpen(true); }}><i className="ti ti-plus" />Make Marketing Account</button>} />
      <div className="ix-grid c3" style={{ marginBottom: 18 }}>
        <StatCard label="Total Marketing Accounts" value={String(rows.length)} icon="ti-speakerphone" note="Approved by admin" />
      </div>
      <EntityTable rows={rows} columns={cols} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/users/${u.id}`)}
        searchText={(u) => `${u.id} ${u.name} ${u.email} ${u.accountId}`} searchPlaceholder="Search marketing accounts…"
        filters={[{ label: "Status", options: ["Active", "Warned", "Banned", "Pending", "Approved"], get: (u) => u.accountStatus }]}
        dateGet={(u) => u.marketing!.assignedAt} dateLabel="Assigned" exportName="marketing-accounts"
        exportRow={(u) => ({ "User ID": u.id, Name: u.name, Email: u.email, Account: u.accountId, Status: u.accountStatus, Assigned: fmtDate(u.marketing!.assignedAt), "Approved By": u.marketing!.approvedBy })} />
      {pickOpen && (
        <Modal title="Make Marketing Account" onClose={() => setPickOpen(false)} footer={<>
          <button className="ix-btn ix-btn-outline" onClick={() => setPickOpen(false)}>Cancel</button>
          <button className="ix-btn ix-btn-primary" disabled={!pick} onClick={() => { setConfirmAdd(d.users.find((u) => u.id === pick) ?? null); setPickOpen(false); }}>Continue</button></>}>
          Select a normal user. You will be asked to confirm the approval next.
          <div className="ix-field"><label>User</label>
            <select className="ix-select" value={pick} onChange={(e) => setPick(e.target.value)}>
              {candidates.map((u) => <option key={u.id} value={u.id}>{u.id} — {u.name}</option>)}
            </select></div>
        </Modal>
      )}
      {confirmAdd && <ConfirmationModal title="Approve Marketing Account?" confirmLabel="Approve" message={<><b>{confirmAdd.name}</b> ({confirmAdd.id}) will become a Marketing Account.</>} onConfirm={() => d.makeMarketing(confirmAdd.id)} onClose={() => setConfirmAdd(null)} />}
      {remove && <ConfirmationModal title="Remove Marketing status?" tone="warn" confirmLabel="Remove" message={<><b>{remove.name}</b> will return to a normal client account.</>} onConfirm={() => d.removeMarketing(remove.id)} onClose={() => setRemove(null)} />}
    </>
  );
}
