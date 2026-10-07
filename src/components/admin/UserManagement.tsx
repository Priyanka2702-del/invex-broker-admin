"use client";
/** Admin management panels for the detailed User Profile: upline, verification, funds, custom IB, ranks, marketing, revenue link, transactions. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmationModal, { Modal } from "./ConfirmationModal";
import SearchSelect from "./SearchSelect";
import StatusBadge from "./StatusBadge";
import { Card, IdLink, InfoGrid } from "./ui";
import { useAdminData } from "@/context/AdminDataContext";
import { IB_RANKS } from "@/data/ibs";
import { REBATE_DEFAULT, REVENUE_DEFAULT, teamIds, uplineChain } from "@/lib/network";
import { fmtDate, fmtDateTime, money } from "@/lib/format";
import type { Deposit, IBRank, User, Withdrawal } from "@/types/admin";

type Dlg = "" | "upline" | "referral" | "login" | "plusW" | "plusE" | "minusW" | "minusE" | "grant";

export default function UserManagement({ user, section }: { user: User; section: "management" | "transactions" }) {
  const d = useAdminData();
  const router = useRouter();
  const [dlg, setDlg] = useState<Dlg>("");
  const upline = d.users.find((u) => u.id === user.uplineId);
  const ib = d.ibs.find((i) => i.userId === user.id);
  const [rebate, setRebate] = useState<string[]>((user.customIb?.rebate ?? REBATE_DEFAULT).map(String));
  const [revenue, setRevenue] = useState<string[]>((user.customIb?.revenue ?? REVENUE_DEFAULT).map(String));
  const [editTx, setEditTx] = useState<{ kind: "deposit" | "withdrawal"; tx: Deposit | Withdrawal } | null>(null);
  const customValid = [...rebate, ...revenue].every((v) => v !== "" && Number(v) >= 0) && revenue.every((v) => Number(v) <= 100);
  const isCustom = !!user.customIb;
  const deps = d.deposits.filter((x) => x.userId === user.id); const wds = d.withdrawals.filter((x) => x.userId === user.id);

  if (section === "transactions") {
    const rows = [...deps.map((x) => ({ kind: "deposit" as const, tx: x })), ...wds.map((x) => ({ kind: "withdrawal" as const, tx: x }))].sort((a, b) => b.tx.createdAt.localeCompare(a.tx.createdAt));
    return (
      <Card title="Edit transactions" subtitle="Edits are written to the audit log. Wallet balances are not recalculated automatically — use Plus/Minus balance for adjustments." flush>
        {rows.length === 0 ? <div className="ix-empty"><i className="ti ti-database-off" />No transactions</div> : (
          <div className="ix-tbl-wrap"><table className="ix-table"><thead><tr><th>ID</th><th>Type</th><th className="num">Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>{rows.map(({ kind, tx }) => <tr key={tx.id}><td><IdLink href={`/${kind === "deposit" ? "deposits" : "withdrawals"}/${tx.id}`}>{tx.id}</IdLink></td><td>{kind === "deposit" ? "Deposit" : "Withdrawal"}</td><td className="num"><b>{money(tx.amount)}</b></td><td>{tx.method}</td><td><StatusBadge status={tx.status} /></td><td>{fmtDateTime(tx.createdAt)}</td>
              <td><button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setEditTx({ kind, tx })}><i className="ti ti-pencil" />Edit</button></td></tr>)}</tbody></table></div>)}
        {editTx && <EditTxModal key={editTx.tx.id} {...editTx} onClose={() => setEditTx(null)} />}
      </Card>
    );
  }
  const sel = (v: string, onChange: (v: string) => void, opts: [string, string][]) => <select className="ix-select" value={v} onChange={(e) => onChange(e.target.value)}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
  return (
    <div className="ix-grid c2">
      <Card title="Upline" action={upline && <StatusBadge status="Active" />}>
        <InfoGrid items={[["Current upline", upline ? <IdLink key="u" href={`/users/${upline.id}`}>{upline.name} ({upline.id})</IdLink> : "None"], ["Referring IB", user.ibId ?? "Direct"], ["Chain (L1→L5)", uplineChain(d.users, user.id).map((u) => u.id).join(" → ") || "—"]]} />
        <div className="ix-row" style={{ marginTop: 16 }}>
          <button className="ix-btn ix-btn-outline" disabled={!upline} onClick={() => upline && router.push(`/users/${upline.id}`)}><i className="ti ti-eye" />View Upline</button>
          <button className="ix-btn ix-btn-soft" onClick={() => setDlg("upline")}><i className="ti ti-switch-horizontal" />Change Upline</button>
          <button className="ix-btn ix-btn-outline" onClick={() => setDlg("referral")}><i className="ti ti-pencil" />Edit Upline</button>
        </div>
      </Card>
      <Card title="Verification">
        <InfoGrid items={[["KYC", <StatusBadge key="k" status={user.kycStatus} />], ["Verification status", user.kycStatus === "Approved" ? "Identity verified" : user.kycStatus === "Pending" ? "Under review" : user.kycStatus === "Rejected" ? "Rejected — resubmission needed" : "Not submitted"],
          ["Email", user.email], ["Phone", user.phone], ["Account status", <StatusBadge key="a" status={user.accountStatus} />]]} />
        <div className="ix-row" style={{ marginTop: 16 }}><Link href="/kyc" className="ix-btn ix-btn-outline"><i className="ti ti-shield-check" />Open KYC review</Link>
          <button className="ix-btn ix-btn-primary" onClick={() => setDlg("login")}><i className="ti ti-login-2" />Login to User Account</button></div>
      </Card>
      <Card title="Plus balance" subtitle="Credit funds">
        <div className="ix-row"><button className="ix-btn ix-btn-ok" onClick={() => setDlg("plusW")}><i className="ti ti-wallet" />Add Balance</button><button className="ix-btn ix-btn-ok" onClick={() => setDlg("plusE")}><i className="ti ti-chart-line" />Add Equity</button></div>
        <p style={{ fontSize: 12.5, color: "var(--ix-muted)", marginTop: 12 }}>Add Balance credits the Index Wallet. Add Equity credits MT5 equity only.</p>
        <InfoGrid items={[["Index Wallet", money(user.balance)], ["MT5 equity", money(user.mt5Equity)]]} />
      </Card>
      <Card title="Minus balance" subtitle="Debit funds">
        <div className="ix-row"><button className="ix-btn ix-btn-danger" onClick={() => setDlg("minusW")}><i className="ti ti-wallet-off" />Minus Wallet Balance</button><button className="ix-btn ix-btn-danger" onClick={() => setDlg("minusE")}><i className="ti ti-chart-line" />Minus Equity from MT5</button></div>
        <p style={{ fontSize: 12.5, color: "var(--ix-muted)", marginTop: 12 }}>Amounts cannot exceed the available balance.</p>
      </Card>
      <Card title="Custom IB values" subtitle={isCustom ? "Custom values active" : "Using defaults"} action={isCustom && <span className="ix-badge amber">Custom</span>}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ix-muted)", marginBottom: 6 }}>REBATE ($ per lot) — default 10 / 5 / 5 / 5 / 5</div>
        <div className="ix-row" style={{ flexWrap: "nowrap", gap: 8 }}>{rebate.map((v, i) => <div key={i} style={{ flex: 1 }}><small style={{ color: "var(--ix-muted)" }}>L{i + 1}</small><input type="number" min={0} className="ix-input" style={{ width: "100%" }} value={v} onChange={(e) => setRebate(rebate.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Rebate level ${i + 1}`} /></div>)}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ix-muted)", margin: "16px 0 6px" }}>REVENUE (%) — default 30 / 5 / 5 / 5 / 5</div>
        <div className="ix-row" style={{ flexWrap: "nowrap", gap: 8 }}>{revenue.map((v, i) => <div key={i} style={{ flex: 1 }}><small style={{ color: "var(--ix-muted)" }}>L{i + 1}</small><input type="number" min={0} max={100} className="ix-input" style={{ width: "100%" }} value={v} onChange={(e) => setRevenue(revenue.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Revenue level ${i + 1}`} /></div>)}</div>
        <div className="ix-row" style={{ marginTop: 16 }}>
          <button className="ix-btn ix-btn-primary" disabled={!customValid} onClick={() => d.setCustomIb(user.id, { rebate: rebate.map(Number), revenue: revenue.map(Number) })}>Save custom values</button>
          <button className="ix-btn ix-btn-outline" onClick={() => { setRebate(REBATE_DEFAULT.map(String)); setRevenue(REVENUE_DEFAULT.map(String)); d.setCustomIb(user.id, undefined); }}>Reset to default</button>
        </div>
      </Card>
      <Card title="Ranks">
        <div className="ix-field" style={{ marginTop: 0 }}><label>IB rank {ib ? `(${ib.id})` : "(not an IB yet — assigning creates an IB profile)"}</label>
          {sel(ib?.rank ?? "", (v) => v && d.assignIbRank(user.id, v as IBRank), [["", "Select IB rank…"], ...IB_RANKS.map((r) => [r, `${r} IB`] as [string, string])])}</div>
        <div className="ix-field"><label>System rank (lifetime, independent of Equity Bonus)</label>
          {sel(user.systemRankId ?? "", (v) => (v ? d.assignRank(user.id, v) : d.removeFromRank(user.id)), [["", "No system rank"], ...d.ranks.map((r) => [r.id, r.name] as [string, string])])}</div>
      </Card>
      <Card title="Marketing Account">
        {user.marketing ? <>
          <InfoGrid items={[["Status", <span className="ix-badge blue" key="s">Marketing Account</span>], ["Approved by", user.marketing.approvedBy], ["Since", fmtDate(user.marketing.assignedAt)], ["Dummy dollars", money(user.marketing.dummyDollars, 0)]]} />
          <p style={{ fontSize: 12.5, color: "var(--ix-muted)", margin: "12px 0" }}>Dummy dollars are for marketing purposes only and cannot be withdrawn.</p>
          <div className="ix-row"><button className="ix-btn ix-btn-soft" onClick={() => setDlg("grant")}><i className="ti ti-coin" />Grant dummy dollars</button><button className="ix-btn ix-btn-danger" onClick={() => d.removeMarketing(user.id)}>Remove status</button></div></>
          : <><p style={{ fontSize: 13.5, marginBottom: 14 }}>Not a Marketing Account. Approved accounts receive dummy dollars for marketing purposes only.</p><button className="ix-btn ix-btn-primary" onClick={() => d.makeMarketing(user.id)}><i className="ti ti-check" />Approve as Marketing Account</button></>}
      </Card>
      <Card title="Revenue Link" action={<StatusBadge status={user.revenueLink === "None" ? "Not requested" : user.revenueLink} />}>
        <p style={{ fontSize: 13.5, marginBottom: 14 }}>{user.revenueLink === "Approved" ? "User Dashboard → Affiliate Program shows the Revenue Link." : "Not approved — the user's Affiliate Program shows only the Rebate Link."}</p>
        <div className="ix-row"><button className="ix-btn ix-btn-ok" disabled={user.revenueLink === "Approved"} onClick={() => d.setRevenueLink(user.id, "Approved")}><i className="ti ti-check" />Approve</button><button className="ix-btn ix-btn-danger" disabled={user.revenueLink === "Rejected"} onClick={() => d.setRevenueLink(user.id, "Rejected")}><i className="ti ti-x" />Reject</button></div>
      </Card>

      {dlg === "login" && <ConfirmationModal title="Login to user account?" confirmLabel="Open session" message={<>You will open a session as <b>{user.name}</b> ({user.id}). This action is recorded in the audit log.</>}
        onConfirm={() => { d.log("Login to user account", "Clients", "Admin opened a user session", user.id); const base = process.env.NEXT_PUBLIC_USER_APP_URL; if (base) window.open(`${base}/impersonate?uid=${user.id}`, "_blank"); else d.toast("Session recorded — set NEXT_PUBLIC_USER_APP_URL to open the user dashboard", "warn"); }} onClose={() => setDlg("")} />}
      {(dlg === "plusW" || dlg === "plusE" || dlg === "minusW" || dlg === "minusE") && <FundsModal user={user} mode={dlg} onClose={() => setDlg("")} />}
      {dlg === "grant" && <AmountModal title="Grant dummy dollars" label="Amount (dummy $)" cta="Grant" onSubmit={(n) => d.grantDummy(user.id, n)} onClose={() => setDlg("")} />}
      {dlg === "upline" && <UplineModal user={user} onClose={() => setDlg("")} />}
      {dlg === "referral" && <ReferralModal user={user} onClose={() => setDlg("")} />}
    </div>
  );
}
function AmountModal({ title, label, cta, max, onSubmit, onClose }: { title: string; label: string; cta: string; max?: number; onSubmit: (n: number, reason: string) => void; onClose: () => void }) {
  const [v, setV] = useState(""); const [reason, setReason] = useState("");
  const n = Number(v); const bad = !(n > 0) || (max !== undefined && n > max);
  return (
    <Modal title={title} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={bad} onClick={() => { onSubmit(n, reason.trim()); onClose(); }}>{cta}</button></>}>
      <div className="ix-field" style={{ marginTop: 0 }}><label>{label}</label><input type="number" min={0} className="ix-input" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
        {max !== undefined && <small style={{ color: n > max ? "var(--ix-red)" : "var(--ix-muted)" }}>Available: {money(max)}</small>}</div>
      <div className="ix-field"><label>Reason (recorded in audit log)</label><input className="ix-input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </Modal>
  );
}
function FundsModal({ user, mode, onClose }: { user: User; mode: "plusW" | "plusE" | "minusW" | "minusE"; onClose: () => void }) {
  const { adjustFunds } = useAdminData();
  const target = mode.endsWith("W") ? "wallet" : "equity"; const plus = mode.startsWith("plus");
  const title = { plusW: "Add Balance (Index Wallet)", plusE: "Add Equity (MT5 only)", minusW: "Minus Wallet Balance", minusE: "Minus Equity from MT5" }[mode];
  return <AmountModal title={title} label="Amount ($)" cta={plus ? "Add" : "Deduct"} max={plus ? undefined : target === "wallet" ? user.balance : user.mt5Equity} onSubmit={(n, r) => adjustFunds(user.id, target, plus ? n : -n, r)} onClose={onClose} />;
}
function UplineModal({ user, onClose }: { user: User; onClose: () => void }) {
  const d = useAdminData();
  const blocked = teamIds(d.users, user.id); blocked.add(user.id); // prevent loops
  const opts = d.users.filter((u) => !blocked.has(u.id));
  const [v, setV] = useState(user.uplineId ?? "");
  return (
    <Modal title="Change upline" onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" onClick={() => { d.changeUpline(user.id, v || undefined); onClose(); }}>Save</button></>}>
      Users already in this client&apos;s downline are excluded to avoid loops.
      <div className="ix-field"><label>New upline (search by name, ID or email)</label>
        <SearchSelect value={v} onChange={setV} noneLabel="No upline" placeholder="Search user…" options={opts.map((u) => ({ value: u.id, label: `${u.name} (${u.id})`, sub: u.email }))} /></div>
    </Modal>
  );
}
function ReferralModal({ user, onClose }: { user: User; onClose: () => void }) {
  const d = useAdminData();
  const [v, setV] = useState(user.ibId ?? "");
  return (
    <Modal title="Edit upline referral" onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" onClick={() => { d.editReferral(user.id, v || undefined); onClose(); }}>Save</button></>}>
      Sets the IB link this client registered under; the registration type follows the IB type.
      <div className="ix-field"><label>Referring IB (search by IB ID, name or type)</label>
        <SearchSelect value={v} onChange={setV} noneLabel="None (direct)" placeholder="Search IB…" options={d.ibs.filter((i) => i.userId !== user.id).map((i) => ({ value: i.id, label: `${i.id} — ${d.users.find((u) => u.id === i.userId)?.name ?? ""}`, sub: `${i.type} · ${i.rank} IB` }))} /></div>
    </Modal>
  );
}
function EditTxModal({ kind, tx, onClose }: { kind: "deposit" | "withdrawal"; tx: Deposit | Withdrawal; onClose: () => void }) {
  const { editTransaction } = useAdminData();
  const [amount, setAmount] = useState(String(tx.amount)); const [method, setMethod] = useState(tx.method); const [status, setStatus] = useState<string>(tx.status); const [note, setNote] = useState(tx.note ?? "");
  return (
    <Modal title={`Edit ${tx.id}`} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={!(Number(amount) > 0)} onClick={() => { editTransaction(kind, tx.id, { amount: Number(amount), method, status: status as Deposit["status"], note: note || undefined }); onClose(); }}>Save changes</button></>}>
      <div className="ix-field" style={{ marginTop: 0 }}><label>Amount ($)</label><input type="number" className="ix-input" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="ix-field"><label>Payment method</label><input className="ix-input" value={method} onChange={(e) => setMethod(e.target.value)} /></div>
      <div className="ix-field"><label>Status</label><select className="ix-select" value={status} onChange={(e) => setStatus(e.target.value)}><option>Successful</option><option>Pending</option><option>Rejected</option></select></div>
      <div className="ix-field"><label>Admin note</label><input className="ix-input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
    </Modal>
  );
}
