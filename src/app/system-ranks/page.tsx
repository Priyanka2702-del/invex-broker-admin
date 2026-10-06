"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import CreateRankModal from "@/components/admin/CreateRankModal";
import { PageHeader } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDate } from "@/lib/format";
import type { SystemRank } from "@/types/admin";

export default function SystemRanksPage() {
  const d = useAdminData();
  const router = useRouter();
  const [edit, setEdit] = useState<SystemRank | "new" | null>(null);
  const [del, setDel] = useState<SystemRank | null>(null);
  const count = (id: string) => d.users.filter((u) => u.systemRankId === id).length;
  const cols: Column<SystemRank>[] = [
    { key: "n", header: "Rank Name", render: (r) => <b>{r.name}</b>, sortValue: (r) => r.name },
    { key: "d", header: "Description", render: (r) => <span style={{ color: "var(--ix-muted)" }}>{r.description}</span> },
    { key: "c", header: "Users Count", align: "right", render: (r) => count(r.id), sortValue: (r) => count(r.id) },
    { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "cr", header: "Created Date", render: (r) => fmtDate(r.createdAt), sortValue: (r) => r.createdAt },
    { key: "a", header: "Actions", render: (r) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); router.push(`/system-ranks/${r.id}`); }}><i className="ti ti-users" />Users</button>
        <button className="ix-btn ix-btn-sm ix-btn-outline" onClick={(e) => { e.stopPropagation(); setEdit(r); }}><i className="ti ti-pencil" />Edit</button>
        <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={(e) => { e.stopPropagation(); setDel(r); }} aria-label="Delete rank"><i className="ti ti-trash" /></button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="System Ranks" subtitle="Admin-defined ranks for clients. Separate from IB ranks."
        actions={<button className="ix-btn ix-btn-primary" onClick={() => setEdit("new")}><i className="ti ti-plus" />Create System Rank</button>} />
      <div className="ix-banner blue"><i className="ti ti-info-circle" /><div>Bronze, Silver, Gold and Platinum are <b>placeholder examples only</b>. Edit or delete them and define your final rank names.</div></div>
      <EntityTable rows={d.ranks} columns={cols} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/system-ranks/${r.id}`)}
        searchText={(r) => `${r.name} ${r.description}`} searchPlaceholder="Search ranks…" filters={[{ label: "Status", options: ["Active", "Inactive"], get: (r) => r.status }]}
        exportName="system-ranks" exportRow={(r) => ({ ID: r.id, Name: r.name, Description: r.description, Users: count(r.id), Status: r.status, Created: fmtDate(r.createdAt) })} />
      {edit && <CreateRankModal initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmationModal title="Delete this rank?" tone="danger" confirmLabel="Delete rank" message={<>“{del.name}” will be removed and its {count(del.id)} user(s) unassigned.</>} onConfirm={() => d.deleteRank(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
