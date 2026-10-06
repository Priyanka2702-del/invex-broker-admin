"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
  AccountStatus, AuditLog, Deposit, IB, IBRank, RevenueLinkStatus, Rule, SystemRank, Trade, TxStatus, User, Violation, ViolationStatus, Withdrawal,
} from "@/types/admin";
import { seedAudit } from "@/data/audit";
import { useAdminAuth } from "@/context/AdminAuthContext";
import * as seed from "@/data";
import { NOW, iso } from "@/lib/format";

type Toast = { id: number; msg: string; tone: "ok" | "warn" | "err" };

interface AdminData {
  users: User[]; ibs: IB[]; deposits: Deposit[]; withdrawals: Withdrawal[]; trades: Trade[];
  violations: Violation[]; rules: Rule[]; ranks: SystemRank[];
  auditLogs: AuditLog[];
  log: (action: string, module: string, description: string, userId?: string) => void;
  toast: (msg: string, tone?: Toast["tone"]) => void;
  grantDummy: (id: string, amount: number) => void;
  changeUpline: (id: string, uplineId?: string) => void;
  editReferral: (id: string, ibId?: string) => void;
  adjustFunds: (id: string, target: "wallet" | "equity", delta: number, reason: string) => void;
  setCustomIb: (id: string, v?: { rebate: number[]; revenue: number[] }) => void;
  assignIbRank: (id: string, rank: IBRank) => void;
  setRevenueLink: (id: string, st: RevenueLinkStatus) => void;
  editTransaction: (kind: "deposit" | "withdrawal", id: string, p: Partial<Deposit> & { destination?: string }) => void;
  setUserStatus: (id: string, status: AccountStatus) => void;
  makeMarketing: (id: string) => void; removeMarketing: (id: string) => void;
  reviewDeposit: (id: string, status: Exclude<TxStatus, "Pending">, note?: string) => void;
  reviewWithdrawal: (id: string, status: Exclude<TxStatus, "Pending">, note?: string) => void;
  toggleIB: (id: string) => void;
  addRule: (r: Omit<Rule, "id" | "createdAt">) => void; updateRule: (id: string, p: Partial<Rule>) => void;
  toggleRule: (id: string) => void; deleteRule: (id: string) => void;
  setViolationStatus: (id: string, status: ViolationStatus) => void;
  addRank: (r: Pick<SystemRank, "name" | "description" | "status">) => void;
  updateRank: (id: string, p: Partial<SystemRank>) => void; deleteRank: (id: string) => void;
  assignRank: (userId: string, rankId: string) => void; removeFromRank: (userId: string) => void;
}
const Ctx = createContext<AdminData | undefined>(undefined);
const nextId = (prefix: string, list: { id: string }[]) =>
  `${prefix}-${String(Math.max(0, ...list.map((x) => parseInt(x.id.split("-")[1], 10) || 0)) + 1).padStart(2, "0")}`;

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(seed.users);
  const [ibs, setIbs] = useState<IB[]>(seed.ibs);
  const [deposits, setDeposits] = useState<Deposit[]>(seed.deposits);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(seed.withdrawals);
  const [trades] = useState<Trade[]>(seed.trades);
  const [violations, setViolations] = useState<Violation[]>(seed.violations);
  const [rules, setRules] = useState<Rule[]>(seed.rules);
  const [ranks, setRanks] = useState<SystemRank[]>(seed.systemRanks);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAudit);
  const { admin } = useAdminAuth();
  const adminName = admin?.name ?? "Super Admin";
  const log = useCallback((action: string, module: string, description: string, userId?: string) => {
    setAuditLogs((l) => [{ id: `AUD-${9000 + 31 + l.length}`, admin: adminName, action, module, description, userId, timestamp: iso(NOW + l.length * 1000) }, ...l]);
  }, [adminName]);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const patchUser = (id: string, p: Partial<User>) => setUsers((u) => u.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const nowIso = () => iso(NOW); // demo clock; use new Date().toISOString() with a real API

  const value = useMemo<AdminData>(() => ({
    users, ibs, deposits, withdrawals, trades, violations, rules, ranks, toast, auditLogs, log,
    setUserStatus: (id, status) => {
      patchUser(id, { accountStatus: status });
      log("User status changed", "Clients", `Account status set to ${status}`, id);
      toast(`User ${id} set to ${status}`, status === "Banned" ? "err" : status === "Warned" ? "warn" : "ok");
    },
    makeMarketing: (id) => { patchUser(id, { marketing: { assignedAt: nowIso(), approvedBy: adminName, dummyDollars: 0 } }); log("Marketing Account approved", "Marketing Accounts", "User approved as Marketing Account", id); toast(`User ${id} is now a Marketing Account`); },
    removeMarketing: (id) => { patchUser(id, { marketing: undefined }); log("Marketing status removed", "Marketing Accounts", "Marketing Account status removed", id); toast(`Marketing status removed for ${id}`, "warn"); },
    reviewDeposit: (id, status, note) => {
      const d = deposits.find((x) => x.id === id);
      if (!d || d.status !== "Pending") return;
      setDeposits((l) => l.map((x) => (x.id === id ? { ...x, status, note, processedAt: nowIso(), processedBy: "Super Admin" } : x)));
      if (status === "Successful") setUsers((u) => u.map((x) => (x.id === d.userId ? { ...x, balance: Math.round((x.balance + d.amount) * 100) / 100 } : x)));
      log(status === "Successful" ? "Deposit approved" : "Deposit rejected", "Transactions", `${id} ${status === "Successful" ? "approved" : "rejected"} ($${d.amount})`, d.userId);
      toast(`Deposit ${id} ${status === "Successful" ? "approved" : "rejected"}`, status === "Successful" ? "ok" : "err");
    },
    reviewWithdrawal: (id, status, note) => {
      const w = withdrawals.find((x) => x.id === id);
      if (!w || w.status !== "Pending") return;
      setWithdrawals((l) => l.map((x) => (x.id === id ? { ...x, status, note, processedAt: nowIso(), processedBy: "Super Admin" } : x)));
      if (status === "Rejected") setUsers((u) => u.map((x) => (x.id === w.userId ? { ...x, balance: Math.round((x.balance + w.amount) * 100) / 100 } : x)));
      log(status === "Successful" ? "Withdrawal approved" : "Withdrawal rejected", "Transactions", `${id} ${status === "Successful" ? "approved" : "rejected"} ($${w.amount})`, w.userId);
      toast(`Withdrawal ${id} ${status === "Successful" ? "approved" : "rejected"}`, status === "Successful" ? "ok" : "err");
    },
    grantDummy: (id, amount) => {
      setUsers((u) => u.map((x) => (x.id === id && x.marketing ? { ...x, marketing: { ...x.marketing, dummyDollars: x.marketing.dummyDollars + amount } } : x)));
      log("Dummy dollars granted", "Marketing Accounts", `Granted ${amount} dummy dollars (marketing use only)`, id); toast(`Granted $${amount.toLocaleString("en-US")} dummy dollars`);
    },
    changeUpline: (id, uplineId) => { patchUser(id, { uplineId }); log("Upline changed", "Clients", `Upline changed to ${uplineId ?? "none"}`, id); toast("Upline updated"); },
    editReferral: (id, ibId) => {
      const ib = ibs.find((x) => x.id === ibId);
      patchUser(id, { ibId, registrationType: ib ? ib.type : "Direct", referralSource: ib ? `IB referral link (${ib.linkCode})` : "Direct signup" });
      log("Upline edited", "Clients", `Referral IB set to ${ibId ?? "none (direct)"}`, id); toast("Referral details updated");
    },
    adjustFunds: (id, target, delta, reason) => {
      setUsers((u) => u.map((x) => (x.id !== id ? x : target === "wallet" ? { ...x, balance: Math.max(0, Math.round((x.balance + delta) * 100) / 100) } : { ...x, mt5Equity: Math.max(0, Math.round((x.mt5Equity + delta) * 100) / 100) })));
      const abs = Math.abs(delta).toFixed(2);
      log(delta >= 0 ? "Balance added" : "Balance deducted", "Clients", `${delta >= 0 ? "Added" : "Deducted"} $${abs} ${target === "wallet" ? "Index Wallet" : "MT5 equity"}${reason ? ` — ${reason}` : ""}`, id);
      toast(`${delta >= 0 ? "Added" : "Deducted"} $${abs} ${target === "wallet" ? "wallet balance" : "MT5 equity"}`, delta >= 0 ? "ok" : "warn");
    },
    setCustomIb: (id, v) => { patchUser(id, { customIb: v }); log("Custom IB changed", "IB Management", v ? "Custom rebate/revenue values saved" : "Custom IB values reset to default", id); toast(v ? "Custom IB values saved" : "Reset to default IB values"); },
    assignIbRank: (id, rank) => {
      const ex = ibs.find((x) => x.userId === id);
      if (ex) setIbs((l) => l.map((x) => (x.userId === id ? { ...x, rank } : x)));
      else setIbs((l) => [...l, { id: `IB-${1001 + l.length}`, userId: id, type: "Rebate Link", rank, status: "Active", createdAt: nowIso(), linkCode: `INVEX-${1001 + l.length}` }]);
      log("Rank changed", "IB Management", `IB rank set to ${rank}`, id); toast(`IB rank set to ${rank}`);
    },
    setRevenueLink: (id, st) => { patchUser(id, { revenueLink: st }); log(st === "Approved" ? "Revenue Link approved" : "Revenue Link " + st.toLowerCase(), "Affiliate / Links", `Revenue Link ${st.toLowerCase()}`, id); toast(`Revenue Link ${st.toLowerCase()}`, st === "Approved" ? "ok" : "warn"); },
    editTransaction: (kind, id, p) => {
      if (kind === "deposit") setDeposits((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
      else setWithdrawals((l) => l.map((x) => (x.id === id ? { ...x, ...(p as Partial<Withdrawal>) } : x)));
      log("Transaction edited", "Transactions", `${id} edited`, (kind === "deposit" ? deposits : withdrawals).find((x) => x.id === id)?.userId); toast(`${id} updated`);
    },
    toggleIB: (id) => setIbs((l) => l.map((x) => (x.id === id ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" } : x))),
    addRule: (r) => { setRules((l) => [{ ...r, id: nextId("RULE", l), createdAt: nowIso() }, ...l]); toast(`Rule “${r.name}” created`); },
    updateRule: (id, p) => { setRules((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x))); toast("Rule updated"); },
    toggleRule: (id) => setRules((l) => l.map((x) => {
      if (x.id !== id) return x;
      const status = x.status === "Enabled" ? "Disabled" : "Enabled";
      toast(`Rule “${x.name}” ${status.toLowerCase()}`, status === "Enabled" ? "ok" : "warn");
      return { ...x, status };
    })),
    deleteRule: (id) => { setRules((l) => l.filter((x) => x.id !== id)); toast("Rule deleted", "warn"); },
    setViolationStatus: (id, status) => {
      const v = violations.find((x) => x.id === id);
      if (!v) return;
      setViolations((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
      if (status === "Banned") patchUser(v.userId, { accountStatus: "Banned" });
      if (status === "Warned") setUsers((u) => u.map((x) => (x.id === v.userId && x.accountStatus === "Active" ? { ...x, accountStatus: "Warned" } : x)));
      toast(`${v.id} marked ${status}`, status === "Banned" ? "err" : status === "Warned" ? "warn" : "ok");
    },
    addRank: (r) => { setRanks((l) => [...l, { ...r, id: nextId("RANK", l), createdAt: nowIso() }]); log("System rank created", "System Ranks", `Rank “${r.name}” created`); toast(`System rank “${r.name}” created`); },
    updateRank: (id, p) => { setRanks((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x))); toast("System rank updated"); },
    deleteRank: (id) => {
      setRanks((l) => l.filter((x) => x.id !== id));
      setUsers((u) => u.map((x) => (x.systemRankId === id ? { ...x, systemRankId: undefined } : x)));
      toast("System rank deleted", "warn");
    },
    assignRank: (userId, rankId) => { patchUser(userId, { systemRankId: rankId }); log("Rank changed", "System Ranks", `System rank set to ${ranks.find((r) => r.id === rankId)?.name ?? rankId}`, userId); toast(`User ${userId} assigned to rank`); },
    removeFromRank: (userId) => { patchUser(userId, { systemRankId: undefined }); log("Rank removed", "System Ranks", "System rank removed", userId); toast(`User ${userId} removed from rank`, "warn"); },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [users, ibs, deposits, withdrawals, trades, violations, rules, ranks, toast, auditLogs, log, adminName]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="ix-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ix-toast ix-toast-${t.tone}`}>
            <i className={`ti ${t.tone === "ok" ? "ti-circle-check" : t.tone === "warn" ? "ti-alert-triangle" : "ti-ban"}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useAdminData = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminData must be used inside AdminDataProvider");
  return c;
};
