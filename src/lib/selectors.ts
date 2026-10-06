import type { Deposit, IB, Trade, User, Withdrawal } from "@/types/admin";
import { IB_RATE } from "@/data/ibs";

export function userStats(userId: string, s: { deposits: Deposit[]; withdrawals: Withdrawal[]; trades: Trade[] }) {
  const t = s.trades.filter((x) => x.userId === userId);
  const closed = t.filter((x) => x.status === "Closed");
  return {
    totalDeposit: s.deposits.filter((d) => d.userId === userId && d.status === "Successful").reduce((a, d) => a + d.amount, 0),
    totalWithdraw: s.withdrawals.filter((d) => d.userId === userId && d.status === "Successful").reduce((a, d) => a + d.amount, 0),
    totalProfit: closed.filter((x) => x.profit > 0).reduce((a, x) => a + x.profit, 0),
    totalLoss: closed.filter((x) => x.profit < 0).reduce((a, x) => a + x.profit, 0),
    totalTrades: t.length, liveTrades: t.length - closed.length, closedTrades: closed.length,
    volume: t.reduce((a, x) => a + x.volume, 0),
  };
}

/** Demo formulas — replace with server-side aggregates.
 *  Revenue = 5% of referred deposits + $12/lot · Commission = rank rate per lot + 1% of referred deposits. */
export function ibStats(ib: IB, s: { users: User[]; deposits: Deposit[]; trades: Trade[] }) {
  const referred = s.users.filter((u) => u.ibId === ib.id);
  const ids = new Set(referred.map((u) => u.id));
  const volume = s.trades.filter((t) => ids.has(t.userId)).reduce((a, t) => a + t.volume, 0);
  const dep = s.deposits.filter((d) => ids.has(d.userId) && d.status === "Successful").reduce((a, d) => a + d.amount, 0);
  return {
    referred, referredCount: referred.length,
    activeUsers: referred.filter((u) => u.accountStatus !== "Banned" && u.balance > 0).length,
    volume, revenue: dep * 0.05 + volume * 12, commission: volume * IB_RATE[ib.rank] + dep * 0.01,
  };
}
