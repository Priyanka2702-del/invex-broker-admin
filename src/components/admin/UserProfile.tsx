"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, InfoGrid, NotFoundCard, IdLink } from "./ui";
import UserManagement from "./UserManagement";
import StatusBadge from "./StatusBadge";
import Tabs from "./Tabs";
import ConfirmationModal, { Modal } from "./ConfirmationModal";
import { useAdminData } from "@/context/AdminDataContext";
import { userStats } from "@/lib/selectors";
import { fmtDate, fmtDateTime, money, signedMoney } from "@/lib/format";
import type { AccountStatus } from "@/types/admin";

type Dlg = "" | "warn" | "ban" | "status" | "marketing" | "unmarketing";

export default function UserProfile({ userId }: { userId: string }) {
  const d = useAdminData();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [dlg, setDlg] = useState<Dlg>("");
  const [newStatus, setNewStatus] = useState<AccountStatus>("Active");
  const user = d.users.find((u) => u.id === userId);
  const stats = useMemo(() => userStats(userId, d), [userId, d]);
  if (!user) return <NotFoundCard what={`User ${userId}`} backHref="/clients" />;

  const ib = d.ibs.find((i) => i.id === user.ibId);
  const ownIb = d.ibs.find((i) => i.userId === user.id);
  const rank = d.ranks.find((r) => r.id === user.systemRankId);
  const trades = d.trades.filter((t) => t.userId === userId);
  const deps = d.deposits.filter((x) => x.userId === userId);
  const wds = d.withdrawals.filter((x) => x.userId === userId);
  const vios = d.violations.filter((v) => v.userId === userId);
  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const go = (t: string) => { setTab(t); document.getElementById("user-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <>
      <button className="ix-back" onClick={() => router.back()}><i className="ti ti-arrow-left" />Back</button>
      {user.accountStatus === "Banned" && <div className="ix-banner red"><i className="ti ti-ban" /><div><b>This account is banned.</b> Trading and withdrawals are blocked.</div></div>}
      {user.accountStatus === "Warned" && <div className="ix-banner amber"><i className="ti ti-alert-triangle" /><div><b>This account has an active warning.</b> {vios.filter((v) => v.status === "Warned").length} violation(s) marked as warned.</div></div>}

      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av">{initials}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h1><StatusBadge status={user.accountStatus} /><StatusBadge status={user.kycStatus} />{user.marketing && <span className="ix-badge blue">Marketing Account</span>}</div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}>UID <b className="ix-mono">{user.id}</b> · {user.email} · {user.accountId}</div>
          </div>
          <div className="ix-row">
            <button className="ix-btn ix-btn-outline" onClick={() => go("trades")}><i className="ti ti-chart-candle" />View Trades</button>
            <button className="ix-btn ix-btn-outline" onClick={() => go("deposits")}><i className="ti ti-arrow-bar-to-down" />View Deposits</button>
            <button className="ix-btn ix-btn-outline" onClick={() => go("withdrawals")}><i className="ti ti-arrow-bar-to-up" />View Withdrawals</button>
          </div>
        </div>
        <div className="ix-row" style={{ padding: "14px 22px", borderTop: "1px solid var(--ix-border)", background: "#fafcff", borderRadius: "0 0 16px 16px" }}>
          <button className="ix-btn ix-btn-warn" onClick={() => setDlg("warn")} disabled={user.accountStatus === "Banned"}><i className="ti ti-alert-triangle" />Warn</button>
          <button className="ix-btn ix-btn-danger" onClick={() => setDlg("ban")} disabled={user.accountStatus === "Banned"}><i className="ti ti-ban" />Ban</button>
          <button className="ix-btn ix-btn-soft" onClick={() => { setNewStatus(user.accountStatus); setDlg("status"); }}><i className="ti ti-adjustments" />Change Status</button>
          <span className="ix-spacer" />
          {user.marketing
            ? <button className="ix-btn ix-btn-outline" onClick={() => setDlg("unmarketing")}><i className="ti ti-speakerphone" />Remove Marketing Status</button>
            : <button className="ix-btn ix-btn-primary" onClick={() => setDlg("marketing")}><i className="ti ti-speakerphone" />Make Marketing Account</button>}
        </div>
      </div>

      <div id="user-tabs" style={{ marginBottom: 16 }}>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: "overview", label: "Overview" }, { id: "management", label: "Management" }, { id: "transactions", label: "Edit transactions" }, { id: "trades", label: "Trades", count: trades.length },
          { id: "deposits", label: "Deposits", count: deps.length }, { id: "withdrawals", label: "Withdrawals", count: wds.length },
          { id: "violations", label: "Violations", count: vios.length },
        ]} />
      </div>

      {tab === "overview" && (
        <div className="ix-grid c2">
          <Card title="Basic Information"><InfoGrid items={[
            ["User ID", <span className="ix-mono" key="i">{user.id}</span>], ["Name", user.name], ["Email", user.email], ["Phone", user.phone],
            ["Country", user.country], ["Registration Date", fmtDate(user.createdAt)], ["KYC Status", <StatusBadge key="k" status={user.kycStatus} />],
            ["Account Status", <StatusBadge key="s" status={user.accountStatus} />], ["Trading Account", <span className="ix-mono" key="a">{user.accountId}</span>],
            ["System Rank", rank ? <Link key="r" href={`/system-ranks/${rank.id}`} className="ix-link-id">{rank.name}</Link> : "—"],
          ]} /></Card>
          <Card title="Financial Information"><InfoGrid items={[
            ["Wallet Balance", money(user.balance)], ["Total Deposit", money(stats.totalDeposit)], ["Total Withdraw", money(stats.totalWithdraw)],
            ["Total Profit", <span className="pos" key="p">{signedMoney(stats.totalProfit)}</span>], ["Total Loss", <span className="neg" key="l">{stats.totalLoss === 0 ? money(0) : signedMoney(stats.totalLoss)}</span>],
            ["Net Trading Result", <span className={stats.totalProfit + stats.totalLoss >= 0 ? "pos" : "neg"} key="n">{signedMoney(stats.totalProfit + stats.totalLoss)}</span>],
          ]} /></Card>
          <Card title="Trading Information"><InfoGrid items={[
            ["Total Trades", stats.totalTrades], ["Live Trades", stats.liveTrades], ["Closed Trades", stats.closedTrades], ["Total Volume", `${stats.volume.toFixed(2)} lots`],
          ]} /></Card>
          <Card title="IB Information"><InfoGrid items={[
            ["IB ID", ib ? <IdLink key="b" href={`/ib/profile/${ib.id}`}>{ib.id}</IdLink> : "None (direct)"], ["IB Type", ib?.type ?? "—"], ["IB Rank", ib ? `${ib.rank} IB` : "—"],
            ["Referral Source", user.referralSource], ["Registration Type", user.registrationType],
            ...(ownIb ? [["This user is an IB", <IdLink key="o" href={`/ib/profile/${ownIb.id}`}>{ownIb.id} · {ownIb.rank}</IdLink>] as [string, React.ReactNode]] : []),
          ]} /></Card>
          {user.marketing && <Card title="Marketing Account"><InfoGrid items={[["Assigned", fmtDate(user.marketing.assignedAt)], ["Approved by", user.marketing.approvedBy]]} /></Card>}
        </div>
      )}

      {(tab === "management" || tab === "transactions") && <UserManagement user={user} section={tab} />}

      {tab === "trades" && <Card title="Trades" flush><MiniTable empty="No trades" head={["Trade", "Symbol", "Side", "Volume", "Opened", "P/L", "Status"]}
        rows={trades.map((t) => [<IdLink key="a" href={`/trades/${t.id}`}>{t.id}</IdLink>, t.symbol, <StatusBadge key="b" status={t.side} />, t.volume.toFixed(2), fmtDateTime(t.openTime), <span key="c" className={t.profit >= 0 ? "pos" : "neg"}>{signedMoney(t.profit)}</span>, <StatusBadge key="d" status={t.status} />])} /></Card>}
      {tab === "deposits" && <Card title="Deposits" flush><MiniTable empty="No deposits" head={["Deposit", "Amount", "Method", "Date", "Status"]}
        rows={deps.map((x) => [<IdLink key="a" href={`/deposits/${x.id}`}>{x.id}</IdLink>, money(x.amount), x.method, fmtDateTime(x.createdAt), <StatusBadge key="b" status={x.status} />])} /></Card>}
      {tab === "withdrawals" && <Card title="Withdrawals" flush><MiniTable empty="No withdrawals" head={["Withdrawal", "Amount", "Method", "Date", "Status"]}
        rows={wds.map((x) => [<IdLink key="a" href={`/withdrawals/${x.id}`}>{x.id}</IdLink>, money(x.amount), x.method, fmtDateTime(x.createdAt), <StatusBadge key="b" status={x.status} />])} /></Card>}
      {tab === "violations" && <Card title="Rule violations" flush><MiniTable empty="No violations — clean record" head={["Violation", "Rule", "Trade", "Severity", "Date", "Status"]}
        rows={vios.map((v) => [<IdLink key="a" href={`/risk/violations/${v.id}`}>{v.id}</IdLink>, v.ruleName, <IdLink key="t" href={`/trades/${v.tradeId}`}>{v.tradeId}</IdLink>, <StatusBadge key="s" status={v.severity} />, fmtDateTime(v.createdAt), <StatusBadge key="st" status={v.status} />])} /></Card>}

      {dlg === "warn" && <ConfirmationModal title="Warn this user?" tone="warn" confirmLabel="Send warning" message={<>A warning will be recorded on <b>{user.name}</b> ({user.id}) and the account status set to <b>Warned</b>.</>} onConfirm={() => d.setUserStatus(user.id, "Warned")} onClose={() => setDlg("")} />}
      {dlg === "ban" && <ConfirmationModal title="Ban this user?" tone="danger" confirmLabel="Ban user" message={<>This blocks trading and withdrawals for <b>{user.name}</b> ({user.id}). You can restore access later via Change Status.</>} onConfirm={() => d.setUserStatus(user.id, "Banned")} onClose={() => setDlg("")} />}
      {dlg === "marketing" && <ConfirmationModal title="Approve as Marketing Account?" confirmLabel="Approve" message={<>Admin approval: <b>{user.name}</b> will become a Marketing Account and appear in the Marketing Accounts section.</>} onConfirm={() => d.makeMarketing(user.id)} onClose={() => setDlg("")} />}
      {dlg === "unmarketing" && <ConfirmationModal title="Remove Marketing status?" tone="warn" confirmLabel="Remove" message={<>{user.name} will return to a normal client account.</>} onConfirm={() => d.removeMarketing(user.id)} onClose={() => setDlg("")} />}
      {dlg === "status" && (
        <Modal title="Change account status" onClose={() => setDlg("")} footer={<>
          <button className="ix-btn ix-btn-outline" onClick={() => setDlg("")}>Cancel</button>
          <button className="ix-btn ix-btn-primary" onClick={() => { d.setUserStatus(user.id, newStatus); setDlg(""); }}>Save status</button></>}>
          <div className="ix-field"><label>New status</label>
            <select className="ix-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value as AccountStatus)}>
              {["Active", "Banned", "Pending", "Approved", "Warned"].map((s) => <option key={s}>{s}</option>)}
            </select></div>
        </Modal>
      )}
    </>
  );
}

export function MiniTable({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <div className="ix-empty"><i className="ti ti-database-off" />{empty}</div>;
  return (
    <div className="ix-tbl-wrap">
      <table className="ix-table"><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
    </div>
  );
}
