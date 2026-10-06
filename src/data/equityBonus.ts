import { baseUsers } from "./users";
import { ibs } from "./ibs";
import { rng } from "./random";
import { l2Equity, tierFor } from "@/lib/network";

export interface EquityFailure { date: string; equity: number; required: number }
export interface EquityMonth {
  ibUserId: string; month: string; maintainedEquity: number; pct: number; failures: EquityFailure[];
  status: "Qualified" | "Warning" | "Forfeited" | "Not qualified"; bonus: number; paid: boolean;
}
export const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
/** Current month (2026-09) failure counts seeded for demo; equity itself is read live from the user store. */
export const CURRENT_MONTH = "2026-09";
export const CURRENT_FAILURES: Record<string, number> = { "10021": 1, "10022": 2, "10023": 3 };

export function evaluateMonth(ibUserId: string, month: string, maintained: number, failureCount: number, r: () => number, paid: boolean): EquityMonth {
  const tier = tierFor(maintained);
  const failures: EquityFailure[] = tier ? Array.from({ length: failureCount }, (_, i) => ({
    date: `${month}-${String(4 + i * 9 + Math.floor(r() * 4)).padStart(2, "0")}T${String(8 + Math.floor(r() * 10)).padStart(2, "0")}:00:00.000Z`,
    equity: Math.round(tier.min * (0.82 + r() * 0.15)), required: tier.min,
  })) : [];
  const forfeited = failures.length >= 3;
  return {
    ibUserId, month, maintainedEquity: maintained, pct: tier?.pct ?? 0, failures, paid,
    status: !tier ? "Not qualified" : forfeited ? "Forfeited" : failures.length ? "Warning" : "Qualified",
    bonus: tier && !forfeited ? Math.round((maintained * tier.pct) / 100) : 0,
  };
}
export const equityHistory: EquityMonth[] = ibs.flatMap((ib) => {
  const base = l2Equity(baseUsers, ib.userId);
  return MONTHS.map((m, mi) => {
    const r = rng(Number(ib.userId) * 7 + mi);
    const maintained = Math.round(base * (0.8 + r() * 0.3));
    const x = r(); const fc = x < 0.62 ? 0 : x < 0.82 ? 1 : x < 0.93 ? 2 : 3;
    return evaluateMonth(ib.userId, m, maintained, fc, r, true);
  });
});
