"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader, Card, UserLink, IdLink } from "@/components/admin/ui";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { BarChart, LineChart, Legend } from "@/components/admin/Charts";
import { useAdminData } from "@/context/AdminDataContext";
import { chartData, chartLabels, dashboardStats as s } from "@/data";
import { fmtDateTime, money, num, signedMoney } from "@/lib/format";

const BLUE = "#2456e6", GREEN = "#0f9d58", AMBER = "#e59a1b", RED = "#d92d3a", SKY = "#5b8def";

export default function DashboardPage() {
  const { deposits, withdrawals, trades, violations, users } = useAdminData();
  const router = useRouter();
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const recent = useMemo(() => ({
    dep: [...deposits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    wd: [...withdrawals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    tr: [...trades].sort((a, b) => b.openTime.localeCompare(a.openTime)).slice(0, 5),
    vi: [...violations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  }), [deposits, withdrawals, trades, violations]);
  const cards = [
    { label: "All Deposit", v: money(s.allDeposit.value, 0), d: s.allDeposit.delta, icon: "ti-arrow-bar-to-down", tone: "green" as const },
    { label: "All Withdraw", v: money(s.allWithdraw.value, 0), d: s.allWithdraw.delta, icon: "ti-arrow-bar-to-up", tone: "amber" as const },
    { label: "24 Hours Deposit", v: money(s.deposit24h.value, 0), d: s.deposit24h.delta, icon: "ti-clock-up", tone: "green" as const },
    { label: "24 Hours Withdraw", v: money(s.withdraw24h.value, 0), d: s.withdraw24h.delta, icon: "ti-clock-down", tone: "amber" as const },
    { label: "Total Clients", v: num(s.totalClients.value), d: s.totalClients.delta, icon: "ti-users", tone: "blue" as const },
    { label: "24 Hours New Clients", v: num(s.newClients24h.value), d: s.newClients24h.delta, icon: "ti-user-plus", tone: "blue" as const },
    { label: "Current System Balance", v: money(s.systemBalance.value, 0), d: s.systemBalance.delta, icon: "ti-building-bank", tone: "blue" as const },
  ];
  const flow = [{ name: "Deposit", color: BLUE, values: chartData.deposit }, { name: "Withdraw", color: AMBER, values: chartData.withdraw }];
  const reg = [{ name: "New clients", color: BLUE, values: chartData.registrations }];
  const vol = [{ name: "Volume (lots)", color: SKY, values: chartData.volume }];
  const pl = [{ name: "Profit", color: GREEN, values: chartData.profit }, { name: "Loss", color: RED, values: chartData.loss }];
  const more = (href: string) => <Link href={href} className="ix-btn ix-btn-sm ix-btn-soft">View all</Link>;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Platform-wide deposits, withdrawals, client growth and trading activity." />
      <div className="ix-grid stats" style={{ marginBottom: 18 }}>
        {cards.map((c) => <StatCard key={c.label} label={c.label} value={c.v} icon={c.icon} tone={c.tone} delta={c.d} />)}
      </div>

      <div className="ix-grid c2" style={{ marginBottom: 16 }}>
        <Card title="Deposit vs Withdraw" subtitle="Last 14 days (USD)" action={<Legend series={flow} />}>
          <BarChart series={flow} labels={chartLabels} fmt={(n) => money(n, 0)} />
        </Card>
        <Card title="Client Registrations" subtitle="New clients per day" action={<Legend series={reg} />}>
          <LineChart series={reg} labels={chartLabels} fmt={num} />
        </Card>
        <Card title="Trading Volume" subtitle="Lots traded per day" action={<Legend series={vol} />}>
          <LineChart series={vol} labels={chartLabels} fmt={(n) => `${num(n)} lots`} />
        </Card>
        <Card title="Profit / Loss" subtitle="Client closed-trade result per day" action={<Legend series={pl} />}>
          <BarChart series={pl} labels={chartLabels} fmt={signedMoney} diverging />
        </Card>
      </div>

      <div className="ix-grid c2">
        <Card title="Recent Deposits" action={more("/deposits")} flush>
          <table className="ix-table ix-mini-tbl"><tbody>
            {recent.dep.map((d) => (
              <tr key={d.id} className="click" onClick={() => router.push(`/deposits/${d.id}`)}>
                <td><div className="ix-user-cell"><div><div className="nm">{name(d.userId)}</div><div className="sub">{d.id} · {fmtDateTime(d.createdAt)}</div></div></div></td>
                <td className="num"><b>{money(d.amount)}</b></td><td><StatusBadge status={d.status} /></td>
              </tr>))}
          </tbody></table>
        </Card>
        <Card title="Recent Withdrawals" action={more("/withdrawals")} flush>
          <table className="ix-table ix-mini-tbl"><tbody>
            {recent.wd.map((d) => (
              <tr key={d.id} className="click" onClick={() => router.push(`/withdrawals/${d.id}`)}>
                <td><div className="ix-user-cell"><div><div className="nm">{name(d.userId)}</div><div className="sub">{d.id} · {fmtDateTime(d.createdAt)}</div></div></div></td>
                <td className="num"><b>{money(d.amount)}</b></td><td><StatusBadge status={d.status} /></td>
              </tr>))}
          </tbody></table>
        </Card>
        <Card title="Recent Trades" action={more("/trades")} flush>
          <table className="ix-table ix-mini-tbl"><tbody>
            {recent.tr.map((t) => (
              <tr key={t.id}>
                <td><IdLink href={`/trades/${t.id}`}>{t.id}</IdLink><div className="sub" style={{ fontSize: 12, color: "var(--ix-muted)" }}>User <UserLink id={t.userId} /></div></td>
                <td>{t.symbol} <StatusBadge status={t.side} /></td>
                <td className={`num ${t.profit >= 0 ? "pos" : "neg"}`}>{signedMoney(t.profit)}</td><td><StatusBadge status={t.status} /></td>
              </tr>))}
          </tbody></table>
        </Card>
        <Card title="Recent Risk Violations" action={more("/risk/violations")} flush>
          <table className="ix-table ix-mini-tbl"><tbody>
            {recent.vi.map((v) => (
              <tr key={v.id} className="click" onClick={() => router.push(`/risk/violations/${v.id}`)}>
                <td><div className="nm" style={{ fontWeight: 600 }}>{v.type}</div><div className="sub" style={{ fontSize: 12, color: "var(--ix-muted)" }}>{v.id} · User {v.userId}</div></td>
                <td><StatusBadge status={v.severity} /></td><td><StatusBadge status={v.status} /></td>
              </tr>))}
          </tbody></table>
        </Card>
      </div>
    </>
  );
}
