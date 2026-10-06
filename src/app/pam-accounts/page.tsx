"use client";
import { useMemo, useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import HistoryModal from "@/components/admin/HistoryModal";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { useExtras } from "@/context/AdminExtrasContext";
import type { PamClient } from "@/data/extras";
import { fmtDate, fmtDateTime, money } from "@/lib/format";

export default function PamAccountsPage() {
  const { users } = useAdminData();
  const { pam, pamSettings, savePamSettings } = useExtras();
  const [tab, setTab] = useState("clients");
  const [hist, setHist] = useState<PamClient | null>(null);
  const [f, setF] = useState(pamSettings);
  const nm = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const events = useMemo(() => pam.flatMap((p) => p.history.map((h) => ({ ...h, userId: p.userId, id: p.id }))).sort((a, b) => b.date.localeCompare(a.date)), [pam]);
  const open = pam.filter((p) => p.status !== "Closed");
  const cols: Column<PamClient>[] = [
    { key: "c", header: "Client", render: (p) => <b>{nm(p.userId)}</b>, sortValue: (p) => nm(p.userId) },
    { key: "u", header: "User ID", render: (p) => <UserLink id={p.userId} /> },
    { key: "d", header: "Deposit", align: "right", render: (p) => money(p.deposit, 0), sortValue: (p) => p.deposit },
    { key: "i", header: "Investment", align: "right", render: (p) => <b>{money(p.investment, 0)}</b>, sortValue: (p) => p.investment },
    { key: "dt", header: "Date", render: (p) => fmtDate(p.createdAt), sortValue: (p) => p.createdAt },
    { key: "s", header: "Status", render: (p) => <StatusBadge status={p.status} tone={p.status === "Active" ? "green" : p.status === "Pending" ? "amber" : "slate"} /> },
    { key: "h", header: "History", render: (p) => <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); setHist(p); }}><i className="ti ti-history" />View</button> },
  ];
  return (
    <>
      <PageHeader title="PAM Accounts" subtitle="Percentage Allocation Management — client deposits, investments and settings." />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Total PAM Deposit" value={money(open.reduce((s, p) => s + p.deposit, 0), 0)} icon="ti-building-bank" />
        <StatCard label="Total PAM Clients" value={String(open.length)} icon="ti-users" tone="green" />
        <StatCard label="Total PAM Investment" value={money(open.reduce((s, p) => s + p.investment, 0), 0)} icon="ti-chart-pie" tone="amber" />
        <StatCard label="PAM Account History" value={String(events.length)} icon="ti-history" note="Recorded events" />
      </div>
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={setTab} tabs={[{ id: "clients", label: "Clients", count: pam.length }, { id: "history", label: "Account history", count: events.length }, { id: "settings", label: "PAM settings" }]} /></div>
      {tab === "clients" && <EntityTable rows={pam} rowKey={(p) => p.id} columns={cols} onRowClick={setHist} searchText={(p) => `${nm(p.userId)} ${p.userId} ${p.id}`} searchPlaceholder="Search client…" filters={[{ label: "Status", options: ["Active", "Pending", "Closed"], get: (p) => p.status }]}
        dateGet={(p) => p.createdAt} amountGet={(p) => p.investment} exportName="pam-clients" exportRow={(p) => ({ ID: p.id, Client: nm(p.userId), "User ID": p.userId, Deposit: p.deposit, Investment: p.investment, Date: fmtDate(p.createdAt), Status: p.status })} />}
      {tab === "history" && <EntityTable rows={events} rowKey={(e) => e.id + e.date + e.type} searchText={(e) => `${nm(e.userId)} ${e.userId} ${e.type}`} searchPlaceholder="Search history…" dateGet={(e) => e.date} exportName="pam-history"
        filters={[{ label: "Event", options: [...new Set(events.map((e) => e.type))], get: (e) => e.type }]}
        columns={[{ key: "d", header: "Date/Time", render: (e) => fmtDateTime(e.date), sortValue: (e) => e.date }, { key: "c", header: "Client", render: (e) => <div><b>{nm(e.userId)}</b> <UserLink id={e.userId} /></div> }, { key: "t", header: "Event", render: (e) => e.type }, { key: "a", header: "Amount", align: "right", render: (e) => money(e.amount, 0), sortValue: (e) => e.amount }]}
        initialSort={{ key: "d", dir: "desc" }} exportRow={(e) => ({ Date: fmtDateTime(e.date), "User ID": e.userId, Event: e.type, Amount: e.amount })} />}
      {tab === "settings" && (
        <div className="ix-grid c2">
          <Card title="Profit & return" subtitle="Applied to all PAM accounts">
            <div className="ix-field" style={{ marginTop: 0 }}><label>Profit percentage (%)</label><input type="number" className="ix-input" min={0} max={100} value={f.profitPercentage} onChange={(e) => setF({ ...f, profitPercentage: Number(e.target.value) })} /></div>
            <div className="ix-field"><label>Monthly return (%)</label><input type="number" step="0.1" className="ix-input" value={f.monthlyReturn} onChange={(e) => setF({ ...f, monthlyReturn: Number(e.target.value) })} /></div>
          </Card>
          <Card title="PAM account rules">
            <div className="ix-grid c2" style={{ gap: 0 }}>
              <div className="ix-field" style={{ marginTop: 0 }}><label>Minimum deposit ($)</label><input type="number" className="ix-input" value={f.minDeposit} onChange={(e) => setF({ ...f, minDeposit: Number(e.target.value) })} /></div>
              <div className="ix-field" style={{ marginTop: 0 }}><label>Lock period (months)</label><input type="number" className="ix-input" value={f.lockMonths} onChange={(e) => setF({ ...f, lockMonths: Number(e.target.value) })} /></div>
              <div className="ix-field"><label>Payout day of month</label><input type="number" min={1} max={28} className="ix-input" value={f.payoutDay} onChange={(e) => setF({ ...f, payoutDay: Number(e.target.value) })} /></div>
              <div className="ix-field"><label>Accepting new clients</label><select className="ix-select" value={String(f.acceptingClients)} onChange={(e) => setF({ ...f, acceptingClients: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No (paused)</option></select></div>
            </div>
          </Card>
          <div className="ix-row" style={{ gridColumn: "1 / -1" }}><button className="ix-btn ix-btn-primary" onClick={() => savePamSettings(f)}><i className="ti ti-device-floppy" />Save PAM settings</button><button className="ix-btn ix-btn-outline" onClick={() => setF(pamSettings)}>Reset changes</button></div>
        </div>
      )}
      {hist && <HistoryModal title={`PAM history — ${hist.id}`} userId={hist.userId} userName={nm(hist.userId)} events={hist.history} onClose={() => setHist(null)} />}
    </>
  );
}
