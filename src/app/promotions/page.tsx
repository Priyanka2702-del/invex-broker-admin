"use client";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import ConfirmationModal, { Modal } from "@/components/admin/ConfirmationModal";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { InfoGrid, PageHeader } from "@/components/admin/ui";
import { useExtras } from "@/context/AdminExtrasContext";
import { PROMO_TYPES, type Promotion } from "@/data/extras";
import { fmtDate, num } from "@/lib/format";

export default function PromotionsPage() {
  const { promotions } = useExtras();
  const [edit, setEdit] = useState<Promotion | "new" | null>(null);
  const [del, setDel] = useState<Promotion | null>(null);
  const [manage, setManage] = useState<string | null>(null);
  const list = promotions.list;
  const managed = list.find((p) => p.id === manage);
  const cols: Column<Promotion>[] = [
    { key: "n", header: "Promotion Name", render: (p) => <div><b>{p.name}</b><div className="ix-mono" style={{ color: "var(--ix-muted)" }}>{p.id}</div></div>, sortValue: (p) => p.name },
    { key: "t", header: "Type", render: (p) => p.type },
    { key: "s", header: "Start Date", render: (p) => fmtDate(p.start), sortValue: (p) => p.start },
    { key: "e", header: "End Date", render: (p) => fmtDate(p.end), sortValue: (p) => p.end },
    { key: "st", header: "Status", render: (p) => <StatusBadge status={p.status} tone={p.status === "Active" ? "green" : p.status === "Draft" ? "amber" : "slate"} /> },
    { key: "a", header: "Action", render: (p) => (
      <div className="ix-act">
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setManage(p.id)}>Manage</button>
        <button className="ix-btn ix-btn-sm ix-btn-outline" onClick={() => setEdit(p)}><i className="ti ti-pencil" /></button>
        <button className={`ix-btn ix-btn-sm ${p.status === "Active" ? "ix-btn-warn" : "ix-btn-ok"}`} onClick={() => promotions.update(p.id, { status: p.status === "Active" ? "Inactive" : "Active" })}>{p.status === "Active" ? "Deactivate" : "Activate"}</button>
        <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={() => setDel(p)} aria-label="Delete"><i className="ti ti-trash" /></button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Promotions" subtitle="Bonus promotions, contests, offers and other campaigns." actions={<button className="ix-btn ix-btn-primary" onClick={() => setEdit("new")}><i className="ti ti-plus" />Create promotion</button>} />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Total promotions" value={String(list.length)} icon="ti-gift" />
        <StatCard label="Active" value={String(list.filter((p) => p.status === "Active").length)} icon="ti-circle-check" tone="green" />
        <StatCard label="Drafts" value={String(list.filter((p) => p.status === "Draft").length)} icon="ti-pencil" tone="amber" />
        <StatCard label="Participants" value={num(list.reduce((s, p) => s + p.participants, 0))} icon="ti-users" />
      </div>
      <EntityTable rows={list} rowKey={(p) => p.id} columns={cols} searchText={(p) => `${p.id} ${p.name} ${p.type}`} searchPlaceholder="Search promotions…"
        filters={[{ label: "Type", options: [...PROMO_TYPES], get: (p) => p.type }, { label: "Status", options: ["Active", "Inactive", "Draft"], get: (p) => p.status }]} dateGet={(p) => p.start} dateLabel="Starts" exportName="promotions"
        exportRow={(p) => ({ ID: p.id, Name: p.name, Type: p.type, Start: p.start, End: p.end, Status: p.status })} />
      {edit && <PromoModal initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmationModal title="Delete this promotion?" tone="danger" confirmLabel="Delete" message={<>“{del.name}” will be permanently removed.</>} onConfirm={() => promotions.remove(del.id)} onClose={() => setDel(null)} />}
      {managed && (
        <Modal wide title={`Manage — ${managed.name}`} onClose={() => setManage(null)} footer={<><button className="ix-btn ix-btn-outline" onClick={() => { setEdit(managed); setManage(null); }}>Edit details</button>
          <button className={`ix-btn ${managed.status === "Active" ? "ix-btn-warn" : "ix-btn-ok"}`} onClick={() => promotions.update(managed.id, { status: managed.status === "Active" ? "Inactive" : "Active" })}>{managed.status === "Active" ? "Deactivate" : "Activate"}</button></>}>
          <p style={{ marginBottom: 16 }}>{managed.description}</p>
          <InfoGrid items={[["Type", managed.type], ["Status", <StatusBadge key="s" status={managed.status} tone={managed.status === "Active" ? "green" : "slate"} />], ["Starts", fmtDate(managed.start)], ["Ends", fmtDate(managed.end)], ["Participants", num(managed.participants)]]} />
        </Modal>
      )}
    </>
  );
}
function PromoModal({ initial, onClose }: { initial?: Promotion; onClose: () => void }) {
  const { promotions } = useExtras();
  const [p, setP] = useState<Omit<Promotion, "id">>(initial ?? { name: "", type: "Bonus Promotion", start: "2026-10-01", end: "2026-10-31", status: "Draft", description: "", participants: 0 });
  const bad = p.name.trim().length < 3 || p.end < p.start;
  return (
    <Modal wide title={initial ? "Edit promotion" : "Create promotion"} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button>
      <button className="ix-btn ix-btn-primary" disabled={bad} onClick={() => { if (initial) promotions.update(initial.id, p); else promotions.add(p); onClose(); }}>{initial ? "Save changes" : "Create"}</button></>}>
      <div className="ix-field"><label>Promotion name</label><input className="ix-input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoFocus /></div>
      <div className="ix-grid c3" style={{ gap: 0 }}>
        <div className="ix-field"><label>Type</label><select className="ix-select" value={p.type} onChange={(e) => setP({ ...p, type: e.target.value as Promotion["type"] })}>{PROMO_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="ix-field"><label>Start date</label><input type="date" className="ix-input" value={p.start} onChange={(e) => setP({ ...p, start: e.target.value })} /></div>
        <div className="ix-field"><label>End date</label><input type="date" className="ix-input" value={p.end} onChange={(e) => setP({ ...p, end: e.target.value })} /></div>
      </div>
      {p.end < p.start && <div style={{ color: "var(--ix-red)", fontSize: 12.5, marginTop: 6 }}>End date must be after the start date.</div>}
      <div className="ix-field"><label>Status</label><select className="ix-select" value={p.status} onChange={(e) => setP({ ...p, status: e.target.value as Promotion["status"] })}><option>Active</option><option>Inactive</option><option>Draft</option></select></div>
      <div className="ix-field"><label>Description</label><textarea className="ix-textarea" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></div>
    </Modal>
  );
}
