import type { IBRank, Trade, User, IB } from "@/types/admin";

export const REBATE_DEFAULT = [10, 5, 5, 5, 5]; // $ per lot, Level 1…5
export const REVENUE_DEFAULT = [30, 5, 5, 5, 5]; // % of client loss/profit, Level 1…5
/** Highest revenue-link level each IB rank unlocks. */
export const IB_LEVELS: Record<IBRank, number> = { Basic: 1, Starter: 2, Prime: 3, Crown: 4, Master: 5 };
/** Equity Bonus tiers — monthly, Level 2 Team Current Equity only. */
export const EQUITY_TIERS = [
  { min: 10000, max: 19999, pct: 1 }, { min: 20000, max: 39999, pct: 2 }, { min: 40000, max: 69999, pct: 3 },
  { min: 70000, max: 99999, pct: 4 }, { min: 100000, max: Infinity, pct: 5 },
];
export const tierFor = (eq: number) => [...EQUITY_TIERS].reverse().find((t) => eq >= t.min) ?? null;

/** Ancestors of a user: index 0 = Level 1 (direct upline). */
export function uplineChain(users: User[], userId: string, max = 5): User[] {
  const out: User[] = []; const seen = new Set([userId]);
  let cur = users.find((u) => u.id === userId);
  while (cur?.uplineId && out.length < max && !seen.has(cur.uplineId)) {
    const up = users.find((u) => u.id === cur!.uplineId);
    if (!up) break;
    out.push(up); seen.add(up.id); cur = up;
  }
  return out;
}
export const levelUsers = (users: User[], rootId: string, level: number) =>
  users.filter((u) => uplineChain(users, u.id, level)[level - 1]?.id === rootId);
export const teamIds = (users: User[], rootId: string, maxLevel = 5) => {
  const s = new Set<string>();
  for (let l = 1; l <= maxLevel; l++) levelUsers(users, rootId, l).forEach((u) => s.add(u.id));
  return s;
};
export const l2Equity = (users: User[], id: string) => levelUsers(users, id, 2).reduce((s, u) => s + u.mt5Equity, 0);

export interface RebateRow {
  id: string; ibUserId: string; ibName: string; traderId: string; traderName: string; tradeId: string;
  level: number; volume: number; rebate: number; commission: number; at: string; status: "Distributed" | "Pending" | "On Hold";
}
export function rebateLedger(users: User[], trades: Trade[]): RebateRow[] {
  const rows: RebateRow[] = [];
  for (const t of trades) {
    const trader = users.find((u) => u.id === t.userId);
    if (!trader || trader.registrationType !== "Rebate Link") continue;
    uplineChain(users, trader.id).forEach((up, i) => {
      const rate = up.customIb?.rebate[i] ?? REBATE_DEFAULT[i];
      rows.push({
        id: `RBT-${t.id.slice(4)}-L${i + 1}`, ibUserId: up.id, ibName: up.name, traderId: trader.id, traderName: trader.name, tradeId: t.id,
        level: i + 1, volume: t.volume, rebate: Math.round(rate * t.volume * 100) / 100, commission: t.commission, at: t.openTime,
        status: up.accountStatus === "Banned" ? "On Hold" : t.status === "Open" ? "Pending" : "Distributed",
      });
    });
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

export interface RevenueRow {
  id: string; traderId: string; traderName: string; uplineId: string; uplineName: string; uplineRank: IBRank; tradeId: string;
  level: number; rate: number; pl: number; commission: number; accountPlus: number; accountMinus: number; at: string;
  status: "Settled" | "Pending" | "On Hold";
}
/** Loss → upline gets rate% (Account Plus). Profit → rate% deducted from upline and paid to the user (Account Minus). */
export function revenueLedger(users: User[], ibs: IB[], trades: Trade[], nowMs: number): RevenueRow[] {
  const rows: RevenueRow[] = [];
  for (const t of trades) {
    const trader = users.find((u) => u.id === t.userId);
    if (!trader || trader.registrationType !== "Revenue Link" || t.status !== "Closed" || t.profit === 0) continue;
    uplineChain(users, trader.id).forEach((up, i) => {
      const ib = ibs.find((x) => x.userId === up.id);
      if (!ib || IB_LEVELS[ib.rank] < i + 1) return; // level not unlocked by rank
      const rate = up.customIb?.revenue[i] ?? REVENUE_DEFAULT[i];
      const amt = Math.round(Math.abs(t.profit) * rate) / 100;
      rows.push({
        id: `RVL-${t.id.slice(4)}-L${i + 1}`, traderId: trader.id, traderName: trader.name, uplineId: up.id, uplineName: up.name, uplineRank: ib.rank,
        tradeId: t.id, level: i + 1, rate, pl: t.profit, commission: amt, accountPlus: t.profit < 0 ? amt : 0, accountMinus: t.profit > 0 ? amt : 0,
        at: t.closeTime!, status: up.accountStatus === "Banned" ? "On Hold" : nowMs - Date.parse(t.closeTime!) < 3 * 3_600_000 ? "Pending" : "Settled",
      });
    });
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}
