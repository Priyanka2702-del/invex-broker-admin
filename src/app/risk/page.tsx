"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Card, PageHeader, UserLink } from "@/components/admin/ui";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime } from "@/lib/format";

export default function RiskOverviewPage() {
  const { violations, rules, users } = useAdminData();
  const router = useRouter();
  const byRule = useMemo(() => rules.map((r) => ({ r, n: violations.filter((v) => v.ruleId === r.id).length })).sort((a, b) => b.n - a.n), [rules, violations]);
  const max = Math.max(1, ...byRule.map((x) => x.n));
  const risky = useMemo(() => {
    const m = new Map<string, number>();
    violations.filter((v) => v.status !== "Cleared").forEach((v) => m.set(v.userId, (m.get(v.userId) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ user: users.find((u) => u.id === id)!, n }));
  }, [violations, users]);
  const c = (s: string) => violations.filter((v) => v.status === s).length;
  const sev = ["Critical", "High", "Medium", "Low"].map((s) => ({ s, n: violations.filter((v) => v.severity === s).length }));
  const open = violations.filter((v) => v.status === "Open");
  const steps = [["ti-chart-candle", "User opens trade"], ["ti-cpu", "Trading system evaluates trade"], ["ti-list-check", "Rule engine checks active rules"], ["ti-alert-triangle", "Violation record created"], ["ti-layout-dashboard", "Risk overview updated"]];
  return (
    <>
      <PageHeader title="Risk Overview" subtitle="Live picture of rule violations, exposure by rule and the accounts that need attention."
        actions={<><Link href="/risk/rules" className="ix-btn ix-btn-outline"><i className="ti ti-list-check" />Rules</Link><Link href="/risk/violations" className="ix-btn ix-btn-primary"><i className="ti ti-shield-exclamation" />Violations</Link></>} />
      <div className="ix-grid c4" style={{ marginBottom: 18 }}>
        <StatCard label="Open violations" value={String(c("Open"))} icon="ti-shield-exclamation" tone="red" note="Need review" />
        <StatCard label="Warned" value={String(c("Warned"))} icon="ti-alert-triangle" tone="amber" />
        <StatCard label="Banned" value={String(c("Banned"))} icon="ti-ban" tone="red" />
        <StatCard label="Active rules" value={`${rules.filter((r) => r.status === "Enabled").length} / ${rules.length}`} icon="ti-shield-check" tone="green" />
      </div>
      <Card title="Automatic detection flow" subtitle="The frontend is ready for backend-driven violation records">
        <div className="ix-row" style={{ gap: 8, flexWrap: "wrap" }}>
          {steps.map(([icon, label], i) => (
            <div key={label} className="ix-row" style={{ gap: 8, flexWrap: "nowrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--ix-primary-softer)", border: "1px solid var(--ix-border)", borderRadius: 12, padding: "9px 13px", fontSize: 13, fontWeight: 600 }}>
                <i className={`ti ${icon}`} style={{ color: "var(--ix-primary)", fontSize: 18 }} />{label}</div>
              {i < steps.length - 1 && <i className="ti ti-arrow-right" style={{ color: "var(--ix-faint)" }} />}
            </div>
          ))}
        </div>
      </Card>
      <div className="ix-grid c2" style={{ marginTop: 16 }}>
        <Card title="Violations by rule">
          <div className="ix-stack" style={{ gap: 14 }}>
            {byRule.map(({ r, n }) => (
              <div key={r.id}>
                <div className="ix-row" style={{ justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{r.name}{r.status === "Disabled" && <span style={{ color: "var(--ix-faint)", fontWeight: 400 }}> · disabled</span>}</span><b>{n}</b></div>
                <div className="ix-meter"><div style={{ width: `${(n / max) * 100}%` }} /></div>
              </div>))}
          </div>
        </Card>
        <Card title="Severity & high-risk users">
          <div className="ix-row" style={{ marginBottom: 20 }}>{sev.map((x) => <div key={x.s} style={{ flex: 1, minWidth: 90, border: "1px solid var(--ix-border)", borderRadius: 12, padding: "10px 14px" }}><StatusBadge status={x.s} /><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{x.n}</div></div>)}</div>
          <div style={{ fontSize: 12.5, color: "var(--ix-muted)", marginBottom: 8, fontWeight: 600 }}>USERS WITH ACTIVE VIOLATIONS</div>
          {risky.map(({ user, n }) => user && (
            <div key={user.id} className="ix-row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eef2f8" }}>
              <span><UserLink id={user.id} /> <span style={{ marginLeft: 8 }}>{user.name}</span></span><span className="ix-row" style={{ gap: 8 }}><StatusBadge status={user.accountStatus} /><b>{n}</b></span>
            </div>))}
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Open violations awaiting action" action={<Link href="/risk/violations" className="ix-btn ix-btn-sm ix-btn-soft">View all</Link>} flush>
          <table className="ix-table ix-mini-tbl"><tbody>
            {open.length === 0 && <tr><td className="ix-empty">Nothing open — all violations reviewed.</td></tr>}
            {open.slice(0, 6).map((v) => (
              <tr key={v.id} className="click" onClick={() => router.push(`/risk/violations/${v.id}`)}>
                <td><b>{v.type}</b><div style={{ fontSize: 12, color: "var(--ix-muted)" }}>{v.id} · {fmtDateTime(v.createdAt)}</div></td>
                <td>User <UserLink id={v.userId} /></td><td>{v.tradeId} · {v.symbol}</td><td><StatusBadge status={v.severity} /></td>
              </tr>))}
          </tbody></table>
        </Card>
      </div>
    </>
  );
}
