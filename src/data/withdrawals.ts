import type { TxStatus, Withdrawal } from "@/types/admin";
import { DAY, HOUR, NOW, iso } from "@/lib/format";
import { deposits, DEPOSIT_METHODS, txIdFor } from "./deposits";
import { baseUsers } from "./users";
import { hex, pick, rng } from "./random";

const WD_METHODS = DEPOSIT_METHODS.filter((m) => m !== "Credit/Debit Card");
const totalDep = (id: string) => deposits.filter((d) => d.userId === id && d.status === "Successful").reduce((s, d) => s + d.amount, 0);
const USERS = baseUsers.map((u) => u.id)
  .filter((id) => !["3769969", "10038", "10040", "10044", "10046", "10036"].includes(id)).slice(0, 14);
const REJECT_NOTES = ["KYC verification incomplete", "Withdrawal address not whitelisted", "Open positions require margin"];
const PLAN: [TxStatus, number][] = [
  ...Array.from({ length: 14 }, (_, i) => ["Successful", (6 + i * 3.7) * DAY] as [TxStatus, number]),
  ["Pending", 3 * HOUR], ["Pending", 15 * HOUR], ["Pending", 2 * DAY], ["Pending", 3 * DAY], ["Pending", 4 * DAY],
  ["Rejected", 26 * HOUR], ["Rejected", 5 * DAY], ["Rejected", 9 * DAY], ["Rejected", 12 * DAY], ["Rejected", 20 * DAY],
];
export const withdrawals: Withdrawal[] = PLAN
  .map(([status, ago], i) => ({ status, at: NOW - ago, userId: USERS[i % USERS.length], i }))
  .sort((a, b) => a.at - b.at)
  .map((s, n) => {
    const r = rng(4000 + s.i);
    const method = pick(r, WD_METHODS);
    const amount = Math.max(100, Math.round((totalDep(s.userId) * (0.08 + r() * 0.17)) / 10) * 10);
    const done = s.status !== "Pending";
    return {
      id: `WDR-${40001 + n}`, userId: s.userId, amount, method, txId: txIdFor(r, method), status: s.status,
      createdAt: iso(s.at), processedAt: done ? iso(s.at + (20 + Math.floor(r() * 400)) * 60_000) : undefined,
      processedBy: done ? pick(r, ["Super Admin", "Finance Desk"]) : undefined,
      note: s.status === "Rejected" ? pick(r, REJECT_NOTES) : undefined,
      destination: method === "Bank Transfer" ? `••••${Math.floor(1000 + r() * 8999)} · HSBC` :
        method.includes("ERC") ? `0x${hex(r, 40)}` : method === "Bitcoin" ? `bc1q${hex(r, 30)}` :
        method.includes("TRC") ? `T${hex(r, 33)}` : `${pick(r, ["user", "acct", "pay"])}${Math.floor(1000 + r() * 8999)}@wallet`,
    };
  });
