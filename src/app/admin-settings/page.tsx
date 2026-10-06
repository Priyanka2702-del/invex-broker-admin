"use client";
import Link from "next/link";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import ConfirmationModal, { Modal } from "@/components/admin/ConfirmationModal";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { Card, PageHeader } from "@/components/admin/ui";
import { useExtras } from "@/context/AdminExtrasContext";
import { PERMS, PERM_MODULES, type AdminUser, type Role } from "@/data/extras";
import { fmtDateTime } from "@/lib/format";

export default function AdminSettingsPage() {
  const { admins, roles, systemSettings, saveSystemSettings } = useExtras();
  const [tab, setTab] = useState("admins");
  const [adminEdit, setAdminEdit] = useState<AdminUser | "new" | null>(null);
  const [roleEdit, setRoleEdit] = useState<Role | "new" | null>(null);
  const [delRole, setDelRole] = useState<Role | null>(null);
  const [disable, setDisable] = useState<AdminUser | null>(null);
  const [s, setS] = useState(systemSettings);
  const roleName = (id: string) => roles.list.find((r) => r.id === id)?.name ?? "—";
  const adminCols: Column<AdminUser>[] = [
    { key: "n", header: "Admin", render: (a) => <div className="ix-user-cell"><span className="av">{a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span><div><div className="nm">{a.name}</div><div className="sub">{a.email}</div></div></div>, sortValue: (a) => a.name },
    { key: "r", header: "Role", render: (a) => <span className="ix-badge blue">{roleName(a.roleId)}</span> },
    { key: "s", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
    { key: "l", header: "Last login", render: (a) => fmtDateTime(a.lastLogin), sortValue: (a) => a.lastLogin },
    { key: "x", header: "Actions", render: (a) => <div className="ix-act"><button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setAdminEdit(a)}><i className="ti ti-pencil" />Edit</button>
      {a.status === "Active" ? <button className="ix-btn ix-btn-sm ix-btn-warn" onClick={() => setDisable(a)}>Disable</button> : <button className="ix-btn ix-btn-sm ix-btn-ok" onClick={() => admins.update(a.id, { status: "Active" })}>Enable</button>}</div> },
  ];
  const roleCols: Column<Role>[] = [
    { key: "n", header: "Role", render: (r) => <div><b>{r.name}</b><div style={{ fontSize: 12.5, color: "var(--ix-muted)" }}>{r.description}</div></div>, sortValue: (r) => r.name },
    { key: "a", header: "Admins", align: "right", render: (r) => admins.list.filter((a) => a.roleId === r.id).length },
    { key: "p", header: "Permissions", render: (r) => `${Object.values(r.permissions).reduce((n, p) => n + p.length, 0)} granted across ${Object.keys(r.permissions).length} modules` },
    { key: "x", header: "Actions", render: (r) => <div className="ix-act"><button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setRoleEdit(r)}><i className="ti ti-pencil" />Edit</button><button className="ix-btn ix-btn-sm ix-btn-danger" disabled={admins.list.some((a) => a.roleId === r.id)} title={admins.list.some((a) => a.roleId === r.id) ? "Role is assigned to admins" : "Delete role"} onClick={() => setDelRole(r)}><i className="ti ti-trash" /></button></div> },
  ];
  const tg = (k: keyof typeof s, label: string, hint?: string) => (
    <label key={k} className="ix-row" style={{ justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eef2f8", cursor: "pointer", flexWrap: "nowrap" }}>
      <span><b style={{ fontSize: 14 }}>{label}</b>{hint && <div style={{ fontSize: 12.5, color: "var(--ix-muted)" }}>{hint}</div>}</span>
      <input type="checkbox" checked={Boolean(s[k])} onChange={(e) => setS({ ...s, [k]: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--ix-primary)" }} />
    </label>
  );
  return (
    <>
      <PageHeader title="Admin Settings" subtitle="Admin users, roles and permissions, and platform-wide settings." actions={<Link href="/settings" className="ix-btn ix-btn-outline"><i className="ti ti-plug-connected" />Live API settings (SMTP, wallets)</Link>} />
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={setTab} tabs={[{ id: "admins", label: "Admin users", count: admins.list.length }, { id: "roles", label: "Roles", count: roles.list.length }, { id: "perms", label: "Permissions" }, { id: "system", label: "System settings" }]} /></div>
      {tab === "admins" && <EntityTable rows={admins.list} rowKey={(a) => a.id} columns={adminCols} searchText={(a) => `${a.name} ${a.email}`} searchPlaceholder="Search admins…" filters={[{ label: "Role", options: roles.list.map((r) => r.name), get: (a) => roleName(a.roleId) }, { label: "Status", options: ["Active", "Disabled"], get: (a) => a.status }]}
        exportName="admins" toolbarExtra={<button className="ix-btn ix-btn-primary" onClick={() => setAdminEdit("new")}><i className="ti ti-user-plus" />Add admin</button>} exportRow={(a) => ({ Name: a.name, Email: a.email, Role: roleName(a.roleId), Status: a.status })} />}
      {tab === "roles" && <EntityTable rows={roles.list} rowKey={(r) => r.id} columns={roleCols} searchText={(r) => `${r.name} ${r.description}`} exportName="roles" toolbarExtra={<button className="ix-btn ix-btn-primary" onClick={() => setRoleEdit("new")}><i className="ti ti-plus" />Create role</button>} exportRow={(r) => ({ Role: r.name, Description: r.description })} />}
      {tab === "perms" && (
        <Card title="Permission matrix" subtitle="Rows are roles; each cell lists granted permissions per module. Edit a role to change them.">
          <div className="ix-tbl-wrap"><table className="ix-table"><thead><tr><th>Module</th>{roles.list.map((r) => <th key={r.id}>{r.name}</th>)}</tr></thead>
            <tbody>{PERM_MODULES.map((m) => <tr key={m}><td><b>{m}</b></td>{roles.list.map((r) => <td key={r.id}>{(r.permissions[m] ?? []).length ? (r.permissions[m].length === PERMS.length ? <span className="ix-badge green">Full</span> : <span style={{ fontSize: 12.5 }}>{r.permissions[m].join(", ")}</span>) : <span style={{ color: "var(--ix-faint)" }}>—</span>}</td>)}</tr>)}</tbody></table></div>
        </Card>
      )}
      {tab === "system" && (
        <div className="ix-grid c2">
          <Card title="General">
            <div className="ix-field" style={{ marginTop: 0 }}><label>Platform name</label><input className="ix-input" value={s.platformName} onChange={(e) => setS({ ...s, platformName: e.target.value })} /></div>
            <div className="ix-field"><label>Support email</label><input className="ix-input" value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} /></div>
            <div className="ix-grid c2" style={{ gap: 0 }}>
              <div className="ix-field"><label>Timezone</label><select className="ix-select" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })}>{["UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Dubai"].map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="ix-field"><label>Base currency</label><select className="ix-select" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}><option>USD</option><option>EUR</option></select></div>
            </div>
            {tg("maintenanceMode", "Maintenance mode", "Blocks client logins while enabled")}
          </Card>
          <Card title="Security">
            {tg("requireTwoFactor", "Require two-factor for admins")}
            <div className="ix-field"><label>Session timeout (minutes)</label><input type="number" min={5} className="ix-input" value={s.sessionTimeoutMin} onChange={(e) => setS({ ...s, sessionTimeoutMin: Number(e.target.value) })} /></div>
            <div className="ix-field"><label>Admin IP allow-list (comma separated)</label><input className="ix-input" value={s.ipWhitelist} placeholder="Leave empty to allow all" onChange={(e) => setS({ ...s, ipWhitelist: e.target.value })} /></div>
          </Card>
          <Card title="Alerts">
            {tg("emailAlerts", "Email alerts")}{tg("riskAlerts", "Risk violation alerts")}{tg("withdrawalAlerts", "Pending withdrawal alerts")}
          </Card>
          <Card title="Interface"><div className="ix-field" style={{ marginTop: 0 }}><label>Default table page size</label><select className="ix-select" value={s.pageSize} onChange={(e) => setS({ ...s, pageSize: Number(e.target.value) })}>{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select></div></Card>
          <div className="ix-row" style={{ gridColumn: "1 / -1" }}><button className="ix-btn ix-btn-primary" onClick={() => saveSystemSettings(s)}><i className="ti ti-device-floppy" />Save settings</button><button className="ix-btn ix-btn-outline" onClick={() => setS(systemSettings)}>Reset changes</button></div>
        </div>
      )}
      {adminEdit && <AdminModal initial={adminEdit === "new" ? undefined : adminEdit} onClose={() => setAdminEdit(null)} />}
      {roleEdit && <RoleModal initial={roleEdit === "new" ? undefined : roleEdit} onClose={() => setRoleEdit(null)} />}
      {delRole && <ConfirmationModal title="Delete role?" tone="danger" confirmLabel="Delete" message={<>Role “{delRole.name}” will be removed.</>} onConfirm={() => roles.remove(delRole.id)} onClose={() => setDelRole(null)} />}
      {disable && <ConfirmationModal title="Disable admin?" tone="warn" confirmLabel="Disable" message={<>{disable.name} will no longer be able to sign in.</>} onConfirm={() => admins.update(disable.id, { status: "Disabled" })} onClose={() => setDisable(null)} />}
    </>
  );
}
function AdminModal({ initial, onClose }: { initial?: AdminUser; onClose: () => void }) {
  const { admins, roles } = useExtras();
  const [name, setName] = useState(initial?.name ?? ""); const [email, setEmail] = useState(initial?.email ?? ""); const [roleId, setRoleId] = useState(initial?.roleId ?? roles.list[0]?.id ?? "");
  const valid = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email);
  return (
    <Modal title={initial ? "Edit admin" : "Add admin"} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={!valid} onClick={() => { if (initial) admins.update(initial.id, { name, email, roleId }); else admins.add({ name, email, roleId, status: "Active", lastLogin: "" }); onClose(); }}>{initial ? "Save" : "Add admin"}</button></>}>
      <div className="ix-field"><label>Name</label><input className="ix-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
      <div className="ix-field"><label>Email</label><input className="ix-input" value={email} onChange={(e) => setEmail(e.target.value)} />{email && !valid && <small style={{ color: "var(--ix-red)" }}>Enter a valid email</small>}</div>
      <div className="ix-field"><label>Role</label><select className="ix-select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>{roles.list.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
    </Modal>
  );
}
function RoleModal({ initial, onClose }: { initial?: Role; onClose: () => void }) {
  const { roles } = useExtras();
  const [name, setName] = useState(initial?.name ?? ""); const [description, setDescription] = useState(initial?.description ?? "");
  const [perm, setPerm] = useState<Record<string, string[]>>(initial?.permissions ?? {});
  const flip = (m: string, p: string) => setPerm((x) => { const cur = x[m] ?? []; return { ...x, [m]: cur.includes(p) ? cur.filter((y) => y !== p) : [...cur, p] }; });
  return (
    <Modal wide title={initial ? "Edit role" : "Create role"} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={name.trim().length < 3} onClick={() => { const p = Object.fromEntries(Object.entries(perm).filter(([, v]) => v.length)); if (initial) roles.update(initial.id, { name, description, permissions: p }); else roles.add({ name, description, permissions: p }); onClose(); }}>{initial ? "Save role" : "Create role"}</button></>}>
      <div className="ix-field" style={{ marginTop: 0 }}><label>Role name</label><input className="ix-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
      <div className="ix-field"><label>Description</label><input className="ix-input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="ix-tbl-wrap" style={{ marginTop: 16 }}><table className="ix-table"><thead><tr><th>Module</th>{PERMS.map((p) => <th key={p}>{p}</th>)}</tr></thead>
        <tbody>{PERM_MODULES.map((m) => <tr key={m}><td>{m}</td>{PERMS.map((p) => <td key={p}><input type="checkbox" aria-label={`${m} ${p}`} checked={(perm[m] ?? []).includes(p)} onChange={() => flip(m, p)} style={{ width: 16, height: 16, accentColor: "var(--ix-primary)" }} /></td>)}</tr>)}</tbody></table></div>
    </Modal>
  );
}
