import type { Deposit, TxStatus } from "@/types/admin";
import { DAY, HOUR, NOW, iso } from "@/lib/format";
import { baseUsers } from "./users";
import { hex, pick, rng } from "./random";

export const DEPOSIT_METHODS = ["USDT (TRC20)", "USDT (ERC20)", "Bitcoin", "Bank Transfer", "Credit/Debit Card", "Perfect Money", "Skrill"];
export const txIdFor = (r: () => number, method: string) =>
  method.startsWith("USDT (TRC") || method === "Bitcoin" ? hex(r, 40) :
  method.startsWith("USDT") ? `0x${hex(r, 40)}` :
  method === "Bank Transfer" ? `BNK${Math.floor(1e9 + r() * 9e9)}` :
  method === "Credit/Debit Card" ? `CRD-${Math.floor(1e8 + r() * 9e8)}` : `PM${Math.floor(1e8 + r() * 9e8)}`;

const NO_DEPOSIT = ["10038", "10040", "10044", "10046", "10036", "3769969"];
const DEPOSITORS = baseUsers.map((u) => u.id).filter((id) => !NO_DEPOSIT.includes(id));
const AMOUNTS = [250, 500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 25000];
const REJECT_NOTES = ["Transaction not found on network", "Proof of payment mismatch", "Sender name does not match account holder"];

type Spec = { userId: string; amount?: number; status: TxStatus; at: number };
const specs: Spec[] = [];
// featured client (UID 3769969) — ledger tuned so wallet balance = 2,485.60 incl. TRD-10001 profit
specs.push({ userId: "3769969", amount: 1500, status: "Successful", at: NOW - 30 * DAY });
specs.push({ userId: "3769969", amount: 815.6, status: "Successful", at: NOW - 12 * DAY });
DEPOSITORS.forEach((userId, i) => specs.push({ userId, status: "Successful", at: NOW - (8 + ((i * 37) % 62)) * DAY - i * HOUR }));
const EXTRA: [TxStatus, number][] = [
  ["Pending", 2 * HOUR], ["Successful", 7 * HOUR], ["Pending", 19 * HOUR], ["Rejected", 30 * HOUR],
  ["Successful", 2 * DAY], ["Rejected", 4 * DAY], ["Successful", 5 * DAY], ["Pending", 3.5 * DAY],
  ["Rejected", 6 * DAY], ["Successful", 7 * DAY],
];
const EXTRA_USERS = ["10038", "10020", "10046", "10035", "10044", "10039", "10021", "10041", "10040", "10025"];
EXTRA.forEach(([status, ago], i) => specs.push({ userId: EXTRA_USERS[i], status, at: NOW - ago }));

export const deposits: Deposit[] = specs
  .sort((a, b) => a.at - b.at)
  .map((s, i) => {
    const r = rng(2000 + i);
    const method = pick(r, DEPOSIT_METHODS);
    const done = s.status !== "Pending";
    return {
      id: `DEP-${20001 + i}`, userId: s.userId, amount: s.amount ?? pick(r, AMOUNTS), method,
      txId: txIdFor(r, method), status: s.status, createdAt: iso(s.at),
      processedAt: done ? iso(s.at + (5 + Math.floor(r() * 85)) * 60_000) : undefined,
      processedBy: done ? pick(r, ["Super Admin", "Finance Desk"]) : undefined,
      note: s.status === "Rejected" ? pick(r, REJECT_NOTES) : undefined,
    };
  });
