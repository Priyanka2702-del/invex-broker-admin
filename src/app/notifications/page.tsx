"use client";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import ConfirmationModal, { Modal } from "@/components/admin/ConfirmationModal";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { useExtras } from "@/context/AdminExtrasContext";
import type { AdminNotification } from "@/data/extras";
import { NOW, fmtDateTime, iso, num } from "@/lib/format";

export default function NotificationsPage() {
  const { notifications } = useExtras();
  const { users } = useAdminData();
  const [edit, setEdit] = useState<AdminNotification | "new" | null>(null);
  const [del, setDel] = useState<AdminNotification | null>(null);
  const list = notifications.list;
  const readState = (n: AdminNotification) => (n.status !== "Sent" ? "—" : n.audience === "Specific user" ? (n.read ? "Read" : "Unread") : `${Math.round((n.readCount / Math.max(1, n.recipients)) * 100)}% read`);
  const cols: Column<AdminNotification>[] = [
    { key: "t", header: "Notification", render: (n) => <div style={{ maxWidth: 360, whiteSpace: "normal" }}><b>{n.title}</b><div style={{ fontSize: 12.5, color: "var(--ix-muted)" }}>{n.message}</div></div>, sortValue: (n) => n.title },
    { key: "a", header: "Audience", render: (n) => (n.userId ? <span><UserLink id={n.userId} /> <span style={{ color: "var(--ix-muted)" }}>{users.find((u) => u.id === n.userId)?.name}</span></span> : `All users (${num(n.recipients)})`) },
    { key: "s", header: "Status", render: (n) => <StatusBadge status={n.status} tone={n.status === "Sent" ? "green" : n.status === "Scheduled" ? "blue" : "slate"} /> },
    { key: "r", header: "Read / Unread", render: (n) => <span className={`ix-badge ${n.read || n.readCount > 0 && n.audience === "All users" ? "green" : "slate"}`}>{readState(n)}</span> },
    { key: "d", header: "Created", render: (n) => fmtDateTime(n.createdAt), sortValue: (n) => n.createdAt },
    { key: "x", header: "Action", render: (n) => <div className="ix-act">
      <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setEdit(n)}><i className="ti ti-pencil" />Edit</button>
      {n.status !== "Sent" && <button className="ix-btn ix-btn-sm ix-btn-ok" onClick={() => notifications.update(n.id, { status: "Sent" })}>Send</button>}
      <button className="ix-btn ix-btn-sm ix-btn-danger" onClick={() => setDel(n)} aria-label="Delete"><i className="ti ti-trash" /></button></div> },
  ];
  return (
    <>
      <PageHeader title="Notifications" subtitle="Broadcast or user-specific notifications shown inside the client dashboard." actions={<button className="ix-btn ix-btn-primary" onClick={() => setEdit("new")}><i className="ti ti-plus" />Create notification</button>} />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Total" value={String(list.length)} icon="ti-bell" />
        <StatCard label="Sent" value={String(list.filter((n) => n.status === "Sent").length)} icon="ti-send" tone="green" />
        <StatCard label="Scheduled / draft" value={String(list.filter((n) => n.status !== "Sent").length)} icon="ti-clock" tone="amber" />
        <StatCard label="User-specific unread" value={String(list.filter((n) => n.audience === "Specific user" && n.status === "Sent" && !n.read).length)} icon="ti-mail" />
      </div>
      <EntityTable rows={list} rowKey={(n) => n.id} columns={cols} searchText={(n) => `${n.title} ${n.message} ${n.userId ?? ""}`} searchPlaceholder="Search notifications or user ID…"
        filters={[{ label: "Status", options: ["Sent", "Scheduled", "Draft"], get: (n) => n.status }, { label: "Audience", options: ["All users", "Specific user"], get: (n) => n.audience }, { label: "Read", options: ["Read", "Unread"], get: (n) => (n.audience === "Specific user" ? (n.read ? "Read" : "Unread") : n.readCount > 0 ? "Read" : "Unread") }]}
        dateGet={(n) => n.createdAt} exportName="notifications" initialSort={{ key: "d", dir: "desc" }} exportRow={(n) => ({ ID: n.id, Title: n.title, Audience: n.userId ?? "All users", Status: n.status, Read: readState(n), Created: fmtDateTime(n.createdAt) })} />
      {edit && <NotifModal initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmationModal title="Delete notification?" tone="danger" confirmLabel="Delete" message={<>“{del.title}” will be removed.</>} onConfirm={() => notifications.remove(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
function NotifModal({ initial, onClose }: { initial?: AdminNotification; onClose: () => void }) {
  const { notifications } = useExtras(); const { users } = useAdminData();
  const [title, setTitle] = useState(initial?.title ?? ""); const [message, setMessage] = useState(initial?.message ?? "");
  const [audience, setAudience] = useState<AdminNotification["audience"]>(initial?.audience ?? "All users");
  const [userId, setUserId] = useState(initial?.userId ?? users[0]?.id ?? ""); const [status, setStatus] = useState<AdminNotification["status"]>(initial?.status ?? "Draft");
  const valid = title.trim().length >= 3 && message.trim().length >= 3;
  const save = () => {
    const p = { title: title.trim(), message: message.trim(), audience, userId: audience === "Specific user" ? userId : undefined, status };
    if (initial) notifications.update(initial.id, { ...p, recipients: audience === "All users" ? 12486 : 1 });
    else notifications.add({ ...p, createdAt: iso(NOW), read: false, recipients: audience === "All users" ? 12486 : 1, readCount: 0 });
    onClose();
  };
  return (
    <Modal wide title={initial ? "Edit notification" : "Create notification"} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={!valid} onClick={save}>{initial ? "Save changes" : "Create"}</button></>}>
      <div className="ix-field"><label>Title</label><input className="ix-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div>
      <div className="ix-field"><label>Message</label><textarea className="ix-textarea" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <div className="ix-grid c2" style={{ gap: 0 }}>
        <div className="ix-field"><label>Audience</label><select className="ix-select" value={audience} onChange={(e) => setAudience(e.target.value as AdminNotification["audience"])}><option>All users</option><option>Specific user</option></select></div>
        <div className="ix-field"><label>Status</label><select className="ix-select" value={status} onChange={(e) => setStatus(e.target.value as AdminNotification["status"])}><option>Draft</option><option>Scheduled</option><option>Sent</option></select></div>
      </div>
      {audience === "Specific user" && <div className="ix-field"><label>User</label><select className="ix-select" value={userId} onChange={(e) => setUserId(e.target.value)}>{users.map((u) => <option key={u.id} value={u.id}>{u.id} — {u.name}</option>)}</select></div>}
    </Modal>
  );
}
