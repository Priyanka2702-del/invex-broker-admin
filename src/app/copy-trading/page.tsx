"use client";
import { useState } from "react";
import EntityTable from "@/components/admin/EntityTable";
import type { Column } from "@/components/admin/DataTable";
import HistoryModal from "@/components/admin/HistoryModal";
import RangeStatCard from "@/components/admin/RangeStatCard";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Tabs from "@/components/admin/Tabs";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { useExtras } from "@/context/AdminExtrasContext";
import type { CopyInvestment } from "@/data/extras";
import { fmtDate, fmtTime, money } from "@/lib/format";

export default function CopyTradingPage() {
  const { users } = useAdminData();
  const { copy, copySettings, saveCopySettings } = useExtras();
  const [tab, setTab] = useState("investments");
  const [hist, setHist] = useState<CopyInvestment | null>(null);
  const [f, setF] = useState(copySettings);
  const nm = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const live = copy.filter((c) => c.status === "Active" || c.status === "Pending");
  const cols: Column<CopyInvestment>[] = [
    { key: "u", header: "User", render: (c) => <b>{nm(c.userId)}</b>, sortValue: (c) => nm(c.userId) },
    { key: "id", header: "User ID", render: (c) => <UserLink id={c.userId} /> },
    { key: "a", header: "Investment Amount", align: "right", render: (c) => <b>{money(c.amount, 0)}</b>, sortValue: (c) => c.amount },
    { key: "d", header: "Investment Date", render: (c) => fmtDate(c.createdAt), sortValue: (c) => c.createdAt },
    { key: "t", header: "Investment Time", render: (c) => fmtTime(c.createdAt) },
    { key: "s", header: "Current Status", render: (c) => <StatusBadge status={c.status} tone={c.status === "Active" ? "green" : c.status === "Pending" ? "amber" : "slate"} /> },
    { key: "h", header: "Complete History", render: (c) => `${c.history.length} events` },
    { key: "x", header: "Action", render: (c) => <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={(e) => { e.stopPropagation(); setHist(c); }}><i className="ti ti-history" />History</button> },
  ];
  const cut = f.profitCut === "custom" ? f.customCut : Number(f.profitCut);
  return (
    <>
      <PageHeader title="Copy Trading" subtitle="Client investments in copy trading, plus profit-cut and timeline controls." />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Total Copy Trading Investment" value={money(live.reduce((s, c) => s + c.amount, 0), 0)} icon="ti-copy" note="Active + pending" />
        <StatCard label="Total Users Investing" value={String(new Set(live.map((c) => c.userId)).size)} icon="ti-users" tone="green" />
        <RangeStatCard label="Last 24 Hours Investment" icon="ti-clock-up" tone="amber" initial="24h" compute={(r) => money(copy.filter((c) => Date.parse(c.createdAt) >= r.from && Date.parse(c.createdAt) <= r.to).reduce((s, c) => s + c.amount, 0), 0)} />
        <StatCard label="Active Copiers" value={String(copy.filter((c) => c.status === "Active").length)} icon="ti-activity" />
      </div>
      <div style={{ marginBottom: 16 }}><Tabs active={tab} onChange={setTab} tabs={[{ id: "investments", label: "User investment history", count: copy.length }, { id: "settings", label: "Management & settings" }]} /></div>
      {tab === "investments" && <EntityTable rows={copy} rowKey={(c) => c.id} columns={cols} onRowClick={setHist} searchText={(c) => `${nm(c.userId)} ${c.userId} ${c.id}`} searchPlaceholder="Search user or ID…"
        filters={[{ label: "Status", options: ["Active", "Pending", "Completed", "Withdrawn"], get: (c) => c.status }]} dateGet={(c) => c.createdAt} amountGet={(c) => c.amount} exportName="copy-trading" initialSort={{ key: "d", dir: "desc" }}
        exportRow={(c) => ({ ID: c.id, User: nm(c.userId), "User ID": c.userId, Amount: c.amount, Date: fmtDate(c.createdAt), Time: fmtTime(c.createdAt), Status: c.status })} />}
      {tab === "settings" && (
        <div className="ix-grid c2">
          <Card title="Profit cut percentage" subtitle="Share of copier profit retained by the platform">
            <div className="ix-row" style={{ marginBottom: 12 }}>
              {(["10", "20", "30", "custom"] as const).map((v) => <button key={v} className={`ix-tab ${f.profitCut === v ? "on" : ""}`} style={{ border: "1px solid var(--ix-border)" }} onClick={() => setF({ ...f, profitCut: v })}>{v === "custom" ? "Custom" : `${v}%`}</button>)}
            </div>
            {f.profitCut === "custom" && <div className="ix-field" style={{ marginTop: 0 }}><label>Custom percentage</label><input type="number" min={0} max={100} className="ix-input" value={f.customCut} onChange={(e) => setF({ ...f, customCut: Math.min(100, Math.max(0, Number(e.target.value))) })} /></div>}
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--ix-muted)" }}>Active cut: <b style={{ color: "var(--ix-text)" }}>{cut}%</b>. On a $1,000 profit the platform keeps {money(cut * 10, 0)}.</p>
          </Card>
          <Card title="Timeline conditions">
            <div className="ix-grid c2" style={{ gap: 0 }}>
              <div className="ix-field"><label>Minimum investment ($)</label><input type="number" className="ix-input" value={f.minInvestment} onChange={(e) => setF({ ...f, minInvestment: Number(e.target.value) })} /></div>
              <div className="ix-field"><label>Lock-in period (days)</label><input type="number" className="ix-input" value={f.lockInDays} onChange={(e) => setF({ ...f, lockInDays: Number(e.target.value) })} /></div>
              <div className="ix-field"><label>Settlement cycle</label><select className="ix-select" value={f.settlementCycle} onChange={(e) => setF({ ...f, settlementCycle: e.target.value as "Weekly" | "Monthly" })}><option>Weekly</option><option>Monthly</option></select></div>
              <div className="ix-field"><label>Settlement day</label><input type="number" min={1} max={28} className="ix-input" value={f.settlementDay} onChange={(e) => setF({ ...f, settlementDay: Number(e.target.value) })} /></div>
              <div className="ix-field"><label>Early exit penalty (%)</label><input type="number" className="ix-input" value={f.earlyExitPenalty} onChange={(e) => setF({ ...f, earlyExitPenalty: Number(e.target.value) })} /></div>
            </div>
          </Card>
          <div className="ix-row" style={{ gridColumn: "1 / -1" }}>
            <button className="ix-btn ix-btn-primary" onClick={() => saveCopySettings(f)}><i className="ti ti-device-floppy" />Save settings</button>
            <button className="ix-btn ix-btn-outline" onClick={() => setF(copySettings)}>Reset changes</button>
          </div>
        </div>
      )}
      {hist && <HistoryModal title={`Complete history — ${hist.id}`} userId={hist.userId} userName={nm(hist.userId)} events={hist.history} onClose={() => setHist(null)} />}
    </>
  );
}
