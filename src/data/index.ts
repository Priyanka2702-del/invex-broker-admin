import type { User } from "@/types/admin";
import { baseUsers } from "./users";
import { ibs } from "./ibs";
import { deposits } from "./deposits";
import { withdrawals } from "./withdrawals";
import { trades } from "./trades";
import { violations } from "./violations";
import { rules } from "./rules";
import { systemRanks } from "./systemRanks";
export { dashboardStats, chartData, chartLabels } from "./dashboard";

/** Wallet balance = successful deposits − (successful + pending) withdrawals + realised P/L (never below 0). */
export const users: User[] = baseUsers.map((u) => {
  const dep = deposits.filter((d) => d.userId === u.id && d.status === "Successful").reduce((s, d) => s + d.amount, 0);
  const wd = withdrawals.filter((d) => d.userId === u.id && d.status !== "Rejected").reduce((s, d) => s + d.amount, 0);
  const pnl = trades.filter((t) => t.userId === u.id && t.status === "Closed").reduce((s, t) => s + t.profit, 0);
  return { ...u, balance: Math.max(0, Math.round((dep - wd + pnl) * 100) / 100) };
});
export { ibs, deposits, withdrawals, trades, violations, rules, systemRanks };
