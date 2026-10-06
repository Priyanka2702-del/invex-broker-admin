import type { Violation } from "@/types/admin";
import { OVERRIDES, trades } from "./trades";
import { rules } from "./rules";
import { Date_ } from "./_d";

export const violations: Violation[] = Object.entries(OVERRIDES)
  .filter(([, o]) => o.viol)
  .map(([idx, o], n) => {
    const t = trades[Number(idx)];
    const v = o.viol!;
    const at = Date_(t.closeTime && v.type !== "Hedging" && v.type !== "News trading" ? t.closeTime : t.openTime, 8);
    return {
      id: `VIO-${3001 + n}`, userId: t.userId, ruleId: v.ruleId,
      ruleName: rules.find((r) => r.id === v.ruleId)?.name ?? v.type,
      tradeId: t.id, symbol: t.symbol, type: v.type, createdAt: at,
      severity: v.severity, status: v.status, details: v.details,
    };
  });
